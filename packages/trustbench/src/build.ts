import {EnvironmentFile, environmentPath, loadEnvironment, saveEnvironmentLock} from './environment'
import {loadEntities} from './symbolLoader'
import {veramoAgent} from './veramo/veramoAgent'
import {getProvider} from './veramo/veramoProvider'
import {bundle, createContext} from './bundler/bundler'
import {bundleToWriteCommand, writeBundle} from './bundler/bundleWriter'
import {FsReadDeps} from './fsDeps'
import {nodeFsReadDeps, nodeFsWriteDeps, nodePathDeps} from './fsDepsNode'
import * as fs from 'fs';
import path from 'path';



const fsReadDeps: FsReadDeps = nodeFsReadDeps(fs.promises);
const fsWriteDeps = nodeFsWriteDeps(fs.promises);
const pathDeps = nodePathDeps(path);

export async function init(environmentName?: string, templatePath?: string) {
  const { SecretBox } = await import('@veramo/kms-local')

  if(templatePath) {
      const template: string  = await fsReadDeps
        .readFile(templatePath)

    const templateFile = JSON.parse(template) as EnvironmentFile;
    templateFile.kmsSecretKey = await SecretBox.createSecretKey()
    await fsWriteDeps.writeFile(environmentPath(environmentName), JSON.stringify(templateFile, null, 2))
    return
  }

  const environmentFile: EnvironmentFile = {
    kmsSecretKey: await SecretBox.createSecretKey(),
    entities: {}
  }
  await fsWriteDeps.writeFile(environmentPath(environmentName), JSON.stringify(environmentFile, null, 2))
}

export async function build(environmentName: string, dir: string = 'model') {
  const environment = await loadEnvironment(fsReadDeps, environmentName);
  if (!environment) throw Error('got no environment');


  const loadedEntities = await loadEntities(dir, fsReadDeps, {
    join: path.join,
  });

  const agent = await veramoAgent(environment.environment.kmsSecretKey, environmentName);
  const provider = getProvider(agent);
  const context = await createContext(
    loadedEntities,
    environment.environment,
    environment.environmentLock,
    provider
  );
  const result = await bundle(
    loadedEntities,
    context,
    environment.environmentLock,
    provider
  );

  //new lock
  const newLock = {
    context: context,
    bundle: result,
  };

  await saveEnvironmentLock(fsWriteDeps, newLock, environmentName);
  const command = bundleToWriteCommand(`dist/${environmentName}`, result, environment.environmentLock, pathDeps);
  await writeBundle(command, { f: fsWriteDeps, path: pathDeps });
}