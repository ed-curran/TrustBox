import {
  Bundle,
  Context,
  Environment,
  EnvironmentLock,
} from './bundler/bundler';
import { FsReadDeps, FsWriteDeps } from './fsDeps';

export type EntityConfig = {
  name: string;
  didMethod: string | undefined;
  did: string | undefined;
  origin: string | undefined;
};

export type EnvironmentFile = {
  entities: Record<string, EntityConfig>;
};

type WithMapsAsRecords<Type> = {
  [Property in keyof Type]: Type[Property] extends Map<string, any>
    ? Record<string, any>
    : Type[Property];
};

function fileToEnvironment(
  name: string,
  environmentFile: WithMapsAsRecords<Omit<Environment, 'name'>>
): Environment {
  return {
    name: name,
    entities: new Map(Object.entries(environmentFile.entities)),
  };
}

type EnvironmentLockFile = {
  context: WithMapsAsRecords<Context>;
  bundle: Bundle;
};
//stupid
function fileToLock(lockFile: EnvironmentLockFile): EnvironmentLock {
  const contextFile = lockFile.context;
  return {
    bundle: lockFile.bundle,
    context: {
      environmentName: contextFile.environmentName,
      topics: new Map(Object.entries(contextFile.topics)),
      trustDocs: new Map(Object.entries(contextFile.trustDocs)),
      entities: new Map(Object.entries(contextFile.entities)),
    },
  };
}

function environmentLockToFile(lock: EnvironmentLock): EnvironmentLockFile {
  const context = lock.context;
  return {
    bundle: lock.bundle,
    context: {
      environmentName: context.environmentName,
      topics: Object.fromEntries(context.topics.entries()),
      trustDocs: Object.fromEntries(context.trustDocs.entries()),
      entities: Object.fromEntries(context.entities.entries()),
    },
  };
}

type EnvironmentWithLock =
  | { environment: Environment; environmentLock: EnvironmentLock | undefined }
  | undefined;
export async function loadEnvironment(
  fsReadDeps: FsReadDeps,
  prefix?: string
): Promise<EnvironmentWithLock | undefined> {
  const environmentFilePath = prefix
    ? `./${prefix}.environment.json`
    : 'environment.json';
  const environmentLockFilePath = prefix
    ? `./${prefix}.environment-lock.json`
    : 'environment-lock.json';

  const environmentJson: string | undefined = await fsReadDeps
    .readFile(environmentFilePath)
    .catch(async (reason) => {
      return undefined;
    });

  if (!environmentJson) return undefined;
  const environmentFile = JSON.parse(environmentJson) as EnvironmentFile;
  const environment = fileToEnvironment('default', environmentFile);

  const environmentLockJson = await fsReadDeps
    .readFile(environmentLockFilePath)
    .catch(async (reason) => {
      return undefined;
    });
  if (!environmentLockJson) {
    return { environment, environmentLock: undefined };
  }

  const environmentLockFile = JSON.parse(
    environmentLockJson
  ) as EnvironmentLockFile;
  const environmentLock = fileToLock(environmentLockFile);

  return {
    environment,
    environmentLock,
  };
}

export async function saveEnvironmentLock(
  fsWriteDeps: { writeFile: FsWriteDeps['writeFile'] },
  lock: EnvironmentLock,
  name?: string
): Promise<void> {
  const environmentLockFilePath = name
    ? `./${name}.environment-lock.json`
    : 'environment-lock.json';
  await fsWriteDeps.writeFile(
    environmentLockFilePath,
    JSON.stringify(environmentLockToFile(lock)),
    { encoding: 'utf-8' }
  );
}
