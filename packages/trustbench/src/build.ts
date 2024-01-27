import {
  EnvironmentFile,
  environmentPath,
  loadEnvironment,
  saveEnvironmentLock,
} from './environment';
import { loadEntities } from './symbolLoader';
import { createVeramoAgent } from './veramo/createVeramoAgent';
import { getVeramoProvider } from './veramo/veramoProvider';
import { bundle, createContext, createEntityContext } from './bundler/bundler';
import { FsReadDeps } from './fsDeps';
import { nodeFsReadDeps, nodeFsWriteDeps, nodePathDeps } from './fsDepsNode';
import * as fs from 'fs';
import path from 'path';
import { createFilesystemPublisher } from './publisher/createFilesystemPublisher';
import { createWeb5Publisher } from './web5/createWeb5Publisher';
import { createWeb5Agent } from './web5/createWeb5';
import { getWeb5Provider } from './web5/web5Provider';

const fsReadDeps: FsReadDeps = nodeFsReadDeps(fs.promises);
const fsWriteDeps = nodeFsWriteDeps(fs.promises);
const pathDeps = nodePathDeps(path);

export async function init(environmentName?: string, templatePath?: string) {
  const { SecretBox } = await import('@veramo/kms-local');

  if (templatePath) {
    const template: string = await fsReadDeps.readFile(templatePath);

    const templateFile = JSON.parse(template) as EnvironmentFile;
    templateFile.kmsSecretKey = await SecretBox.createSecretKey();
    await fsWriteDeps.writeFile(
      environmentPath(environmentName),
      JSON.stringify(templateFile, null, 2),
    );
    return;
  }

  const environmentFile: EnvironmentFile = {
    kmsSecretKey: await SecretBox.createSecretKey(),
    entities: {},
  };
  const outPath = environmentPath(environmentName);
  await fsWriteDeps.writeFile(
    outPath,
    JSON.stringify(environmentFile, null, 2),
  );
  return outPath;
}

export async function build(
  environmentName: string,
  dir: string = 'model',
  kmsSecretKey?: string,
) {
  const environment = await loadEnvironment(
    fsReadDeps,
    environmentName,
    kmsSecretKey,
  );
  if (!environment) throw Error('got no environment');

  const loadedEntities = await loadEntities(dir, fsReadDeps, {
    join: path.join,
  });

  const web5Agent = environment.environment.publishWithWeb5
    ? await createWeb5Agent(
        environment.environment.kmsSecretKey,
        environmentName,
      )
    : undefined;
  const provider = web5Agent
    ? await getWeb5Provider(web5Agent)
    : await getVeramoProvider(
        await createVeramoAgent(
          environment.environment.kmsSecretKey,
          environmentName,
        ),
      );

  const entitiesWithContext = await Promise.all(
    loadedEntities.map((loadedEntity) =>
      createEntityContext(
        loadedEntity,
        environment.environment,
        environment.environmentLock,
        provider,
      ),
    ),
  );
  const context = await createContext(
    entitiesWithContext,
    environment.environment,
  );
  const result = await bundle(
    context.entities,
    context.context,
    environment.environmentLock,
    provider,
  );

  //new lock
  const newLock = {
    context: context.context,
    bundle: result,
  };

  const fsPublisher = await createFilesystemPublisher(
    { f: fsWriteDeps, path: pathDeps },
    environmentName ? `dist/${environmentName}` : `dist/default`,
  );
  console.log('----------publishing to filesystem----------');
  await fsPublisher.publishBundle(result, environment.environmentLock);

  if (web5Agent && environment.environment.publishWithWeb5) {
    console.log('----------publishing to DWN with web5----------');
    const web5Publisher = await createWeb5Publisher(web5Agent);
    await web5Publisher.publishBundle(result, environment.environmentLock);
  }

  await saveEnvironmentLock(fsWriteDeps, newLock, environmentName);
}
