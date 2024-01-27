import { Bundle, Environment, EnvironmentLock } from './bundler/bundler';
import { FsReadDeps, FsWriteDeps } from './fsDeps';
import * as process from 'process';
import { SymbolPool } from './bundler/symbolPool';
import { Context, NamedSymbolWithContext } from './bundler/context';

export type DidConfigurationConfig = {
  jsonLd?: boolean;
  jwt?: boolean;
};
export type EntityConfig = {
  name: string;
  didMethod: string | undefined;
  did: string | undefined;
  origin: string | undefined;
  didConfiguration: DidConfigurationConfig | boolean | undefined;

  additionalOutDir: string | undefined;
};

export type EnvironmentFile = {
  kmsSecretKey?: string;
  publishWithWeb5?: boolean;
  entities: Record<string, EntityConfig>;
};

type WithMapsAsRecords<Type> = {
  [Property in keyof Type]: Type[Property] extends Map<string, any>
    ? Record<string, any>
    : Type[Property];
};

export type ChangeTypeOfKeys<
  T extends object,
  Keys extends keyof T,
  NewType,
> = {
  // Loop to every key. We gonna check if the key
  // is assignable to Keys. If yes, change the type.
  // Else, retain the type.
  [key in keyof T]: key extends Keys ? NewType : T[key];
};

function fileToEnvironment(
  name: string,
  environmentFile: EnvironmentFile,
  kmsSecretKey?: string,
): Environment {
  const kmsSecretKet =
    kmsSecretKey ??
    environmentFile.kmsSecretKey ??
    process.env.TRUSTBENCH_KMS_SECRET_KEY;
  if (!kmsSecretKet) {
    throw Error(
      `please provide a kms secret key using "mksSecretKey" in the environment.json or using the TRUSTBENCH_KMS_SECRET_KEY env variable`,
    );
  }
  return {
    name: name,
    kmsSecretKey: kmsSecretKet,
    publishWithWeb5: environmentFile.publishWithWeb5 ?? false,
    entities: new Map(Object.entries(environmentFile.entities)),
  };
}

type EnvironmentLockFile = {
  context: WithMapsAsRecords<
    ChangeTypeOfKeys<Context, 'pool', NamedSymbolWithContext[]>
  >;
  bundle: Bundle;
};
//stupid
function fileToLock(lockFile: EnvironmentLockFile): EnvironmentLock {
  const contextFile = lockFile.context;
  return {
    bundle: lockFile.bundle,
    context: {
      environmentName: contextFile.environmentName,
      entities: new Map(Object.entries(contextFile.entities)),
      publishWithWeb5: contextFile.publishWithWeb5,
      pool: new SymbolPool(contextFile.pool),
    },
  };
}

function environmentLockToFile(lock: EnvironmentLock): EnvironmentLockFile {
  const context = lock.context;
  return {
    bundle: lock.bundle,
    context: {
      environmentName: context.environmentName,
      entities: Object.fromEntries(context.entities.entries()),
      publishWithWeb5: context.publishWithWeb5,
      pool: context.pool.snapshot(),
    },
  };
}

export function environmentPath(environmentName?: string) {
  return environmentName
    ? `./${environmentName}.environment.json`
    : 'environment.json';
}

export function environmentLockPath(environmentName?: string) {
  return environmentName
    ? `./${environmentName}.environment-lock.json`
    : 'environment-lock.json';
}

type EnvironmentWithLock =
  | { environment: Environment; environmentLock: EnvironmentLock | undefined }
  | undefined;
export async function loadEnvironment(
  fsReadDeps: FsReadDeps,
  prefix?: string,
  kmsSecretKey?: string,
): Promise<EnvironmentWithLock | undefined> {
  const environmentFilePath = environmentPath(prefix);
  const environmentLockFilePath = environmentLockPath(prefix);

  const environmentJson: string | undefined = await fsReadDeps
    .readFile(environmentFilePath)
    .catch(async (reason) => {
      return undefined;
    });

  if (!environmentJson) return undefined;
  const environmentFile = JSON.parse(environmentJson) as EnvironmentFile;

  const environment = fileToEnvironment(
    'default',
    environmentFile,
    kmsSecretKey,
  );

  const environmentLockJson = await fsReadDeps
    .readFile(environmentLockFilePath)
    .catch(async (reason) => {
      return undefined;
    });
  if (!environmentLockJson) {
    return { environment, environmentLock: undefined };
  }

  const environmentLockFile = JSON.parse(
    environmentLockJson,
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
  name?: string,
): Promise<void> {
  const environmentLockFilePath = name
    ? `./${name}.environment-lock.json`
    : 'environment-lock.json';
  await fsWriteDeps.writeFile(
    environmentLockFilePath,
    JSON.stringify(environmentLockToFile(lock)),
    { encoding: 'utf-8' },
  );
}
