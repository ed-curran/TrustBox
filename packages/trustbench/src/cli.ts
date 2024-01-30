#!/bin/env -S node --no-warnings=ExperimentalWarning

import { Command } from 'commander';
import { build, init, signCredential } from './build';
import { veramoCliConfig } from './veramo/veramoCliConfig';
import { loadEnvironment } from './environment';
import { FsReadDeps } from './fsDeps';
import { nodeFsReadDeps } from './fsDepsNode';
import fs from 'fs';
import path from 'path';
import { databaseFileName } from './veramo/veramoConfig';
import {
  parseTrustFrameworkDoc,
  TrustFrameworkIndex,
} from './trustlib/trustframework/trustFrameworkDoc';
import { validator } from './trustlib';
// @ts-expect-error esm bs
import type { UnsignedCredential } from '@veramo/core';

let stdin: string | undefined;
const program = new Command();

program
  .name('trustbench')
  .description('CLI to some JavaScript string utilities')
  .version('0.0.1');

program
  .command('init')
  .description('initialise an environment from a template')
  .argument('[environmentName]', 'name of the environment to initialise')
  .option(
    '--template <templateName>',
    'environment file to use as a template, the contents will be copied with a new kmsSecretKey',
  )
  .action((environmentName, options) => {
    //const templateName = options.template ? 1 : undefined;
    init(environmentName, options.template).then((out) =>
      console.log('written to ' + out),
    );
  });

program
  .command('build')
  .description('build the model for an environment')
  .argument('[environmentName]', 'name of the environment to initialise')
  .option('--model <modelPath>', 'path of the model', './model')
  .option(
    '--secret <secretKey>',
    'secret key to secure the key management system with. It is very important you look after this key. If not provided here, will be retrieved from the environment file or the KMS_SECRET_KEY environment variable',
  )
  .action((environmentName, options) => {
    console.log(options.model);
    build(environmentName, options.model, options.secret).then(() => {
      //done
    });
  });

program
  .command('switch')
  .description(
    'switch environments. atm this is useful to configure the veramo cli for you',
  )
  .argument('[environmentName]', 'name of the environment to switch to')
  .option(
    '--secret <secretKey>',
    'secret key to secure the key management system with. It is very important you look after this key. If not provided here, will be retrieved from the environment file or the KMS_SECRET_KEY environment variable',
  )
  .action(async (environmentName, options) => {
    const fsReadDeps: FsReadDeps = nodeFsReadDeps(fs.promises);

    const environment = await loadEnvironment(
      fsReadDeps,
      environmentName,
      options.secret,
    );
    if (!environment) {
      console.log("environment doesn't exist");
      return;
    }
    const contents = veramoCliConfig({
      //its weird that we use the raw environmentName here instead of environment.name
      //need to more consistently handle the "default" env aka when no env name is provided.
      databaseFile: databaseFileName(environmentName),
      dbEncryptionKey: environment.environment.kmsSecretKey,
    });
    fs.writeFileSync('./agent.yml', contents);
  });

program
  .command('sign')
  .description('sign a verifiable credential as vc-jwt using veramo')
  .option('--env <environmentName>', 'name of the environment')
  .requiredOption(
    '--signer <entityName>',
    'name of the entity the sign the credential as',
  )
  .argument(
    '[unsignedCredential]',
    'the unsigned credential to sign, alternatively this can be provided by stdin',
  )
  .option(
    '--secret <secretKey>',
    'secret key to secure the key management system with. It is very important you look after this key. If not provided here, will be retrieved from the environment file or the KMS_SECRET_KEY environment variable',
  )
  .action(
    async (
      unsignedCredentialArg,
      { env: environmentName, signer: entityName, ...options },
    ) => {
      const unsignedCredential = unsignedCredentialArg ?? stdin;
      if (!unsignedCredential) {
        console.error(
          'expected unsigned credential to be provided as arg or through stdin',
        );
        return;
      }
      const credentialPayload = JSON.parse(unsignedCredential);
      const verifiableCredential = await signCredential(
        environmentName,
        entityName,
        credentialPayload,
        options.secret,
      );
      console.log(verifiableCredential);
    },
  );

const tfGroup = program.command('tf');

tfGroup
  .command('credential')
  .requiredOption(
    '--tfPath <tfPath>',
    'path to trust framework trust establishment doc',
  )
  .option(
    '--local',
    'transform remote paths to file system paths relative to the index file',
  )
  .argument(
    'credentialType',
    'the type of trust framework credential to construct',
  )
  .argument('[subjectData]', 'the data to fill in the credential with')
  .description('create a credential using the provided trust framework')
  .action(async (credentialType, subjectData, options) => {
    const trustFrameworkPathRaw = options.tfPath as string;
    let indexContent: string;

    let fileBase: string | undefined;
    if (URL.canParse(trustFrameworkPathRaw)) {
      const url = new URL(trustFrameworkPathRaw);
      const response = await fetch(url);
      if (!response.ok) {
        console.log('could not retrieve trust framework index');
        return;
      }
      indexContent = await response.text();
    } else {
      const indexPath = path.resolve(trustFrameworkPathRaw);
      indexContent = fs.readFileSync(indexPath, {
        encoding: 'utf-8',
      });
      fileBase = path.dirname(path.resolve(trustFrameworkPathRaw));
    }

    const indexObject = JSON.parse(indexContent) as TrustFrameworkIndex;
    const indexDir = path.dirname(indexObject.self);
    //todo validate all these paths exist
    const trustFrameworkRef = indexObject.entryPoint;
    let doc: string;
    if (URL.canParse(trustFrameworkRef)) {
      if (options.local) {
        if (!fileBase) {
          console.log(
            'can not use local option for trust framework retrieved remotely',
          );
          return;
        }
        const relativePath = trustFrameworkRef.slice(
          indexDir.length,
          trustFrameworkRef.length,
        );
        doc = fs.readFileSync(path.join(fileBase, relativePath), {
          encoding: 'utf-8',
        });
      } else {
        const response = await fetch(new URL(trustFrameworkRef));
        if (!response.ok) {
          console.log('could not fetch trust framework doc');
          return;
        }
        doc = await response.text();
      }
    } else {
      doc = fs.readFileSync(path.resolve(trustFrameworkRef), {
        encoding: 'utf-8',
      });
    }

    const trustDoc = JSON.parse(doc);
    const validate = validator();
    if (!validate(trustDoc)) {
      console.log(validate.errors);
      return;
    }
    const result = parseTrustFrameworkDoc(trustDoc, indexObject);
    if (result.status === 'failure') {
      console.log(result.message);
      return;
    }
    const trustFrameworkDoc = result.value;
    const credentialsMap = new Map(
      trustFrameworkDoc.entries.credentialsTopic.owner.credentials.map(
        (credentialEntry) => [credentialEntry.type, credentialEntry.schema],
      ),
    );
    const schema = credentialsMap.get(credentialType);
    const parsedSubjectData = JSON.parse(subjectData ?? {});
    const credential: UnsignedCredential = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', credentialType],
      issuanceDate: new Date().toISOString(),
      issuer: '',
      credentialSubject: parsedSubjectData,
      credentialSchema: {
        id: schema,
        type: 'JsonSchema',
      },
    };
    console.log(JSON.stringify(credential, null, 2));
  });

if (process.stdin.isTTY) {
  program.parse(process.argv);
} else {
  process.stdin.on('readable', () => {
    const chunk = process.stdin.read();
    if (chunk !== null) {
      if (stdin === undefined) {
        stdin = chunk.toString();
      } else {
        stdin += chunk;
      }
    }
  });
  process.stdin.on('end', () => {
    program.parse(process.argv);
  });
}
