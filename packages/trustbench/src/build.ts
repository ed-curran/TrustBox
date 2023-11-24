import {EnvironmentFile, environmentPath, loadEnvironment, saveEnvironmentLock} from './environment'
import {loadEntities} from './symbolLoader'
import {createVeramoAgent} from './veramo/createVeramoAgent'
import {getProvider} from './veramo/veramoProvider'
import {bundle, createContext} from './bundler/bundler'
import {bundleToWriteCommand, writeBundle} from './publisher/bundleWriter'
import {FsReadDeps} from './fsDeps'
import {nodeFsReadDeps, nodeFsWriteDeps, nodePathDeps} from './fsDepsNode'
import * as fs from 'fs';
import path from 'path';
import {createFilesystemPublisher} from './publisher/createFilesystemPublisher'
import {createWeb5Publisher} from './web5/createWeb5Publisher'
import {createWeb5, createWeb5Agent} from './web5/createWeb5'



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

  const veramoAgent = await createVeramoAgent(environment.environment.kmsSecretKey, environmentName);
  const web5Agent = await createWeb5Agent(environment.environment.kmsSecretKey, environmentName)
  const provider = getProvider(veramoAgent, web5Agent);

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

  const fsPublisher = await createFilesystemPublisher({ f: fsWriteDeps, path: pathDeps }, `dist/${environmentName}`)
  await fsPublisher.publishBundle(result, environment.environmentLock)

  if(environment.environment.publishWithWeb5) {
    const web5Publisher = await createWeb5Publisher(web5Agent)
    await web5Publisher.publishBundle(result, environment.environmentLock)
  }



  await saveEnvironmentLock(fsWriteDeps, newLock, environmentName);
}