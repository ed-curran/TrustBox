import { Bundle, BundledEntity } from './bundler';
import { FsWriteDeps, mkDirIfNotExists, PathDeps } from '../fsDeps';
import path from 'path';
import fs from 'fs';
import { nodeFsWriteDeps } from '../fsDepsNode';

//you could replace all this with some generic FileWriteCommand and DirWriteCommand thing

//writing is easier than reading, and we don't need to read a bundle so
//can do it an easy way
type WriteCommand = {
  //relative path
  dir: string;
  fileName: string;
  path: string;
  value: string;
};

type EntityWriteCommand = {
  entityDir: string;
  commands: WriteCommand[];
};

type BundleWriteCommand = {
  bundleDir: string;
  entityCommands: EntityWriteCommand[];
};

type Deps = {
  f: FsWriteDeps;
  path: PathDeps;
};

async function write(
  command: WriteCommand,
  f: FsWriteDeps,
  existingDirs = new Set<string>()
) {
  console.log('write')
  console.log({dir: command.dir, file: command.fileName, path: command.path})
  await mkDirIfNotExists(command.dir, f, existingDirs);

  return f
    .writeFile(command.path, command.value, {
      encoding: 'utf8',
    })
    .then(() => {
      return {
        status: 'success',
        value: undefined,
      } as const;
    })
    .catch((reason: string) => {
      console.log(reason)
      return {
        status: 'failure',
        message: `failed writing to file ${command.path} with error ${reason}`,
      } as const;
    });
}

export async function writeBundle(
  command: BundleWriteCommand,
  deps: Deps
): Promise<void> {
  await mkDirIfNotExists(command.bundleDir, deps.f, new Set());
  for (const entityWriteCommand of command.entityCommands) {
    //we delete the whole directory and rewrite, probably bad for performance - but easy
    try {
      await deps.f.rm(entityWriteCommand.entityDir, { recursive: true });
    } catch (e) {
      //already exists so thats fine
    }
    await deps.f.mkdir(entityWriteCommand.entityDir, { recursive: false });
    const existingDirs = new Set<string>();
    //its pretty dodgy doing promise.all here, holy race conditions
    const results = await Promise.all(
      entityWriteCommand.commands.map((command) =>
        write(command, deps.f, existingDirs)
      )
    );
    results.forEach((result) => {
      if (result.status === 'failure') {
        console.log(`warn: couldn't write symbol - ${result.message}`);
      }
    });
  }
}

export function bundleToWriteCommand(
  dir: string,
  bundle: Bundle,
  path: PathDeps
): BundleWriteCommand {
  return {
    bundleDir: dir,
    entityCommands: bundle.entities.map((entity) => {
      const entityDir = path.join(dir, entity.name);
      return {
        entityDir,
        commands: entityToCommands(entityDir, entity),
      };
    }),
  };
}

function entityToCommands(
  entityDir: string,
  bundle: BundledEntity
): WriteCommand[] {
  return bundle.outputSymbols.map((symbol) => {
    const dir = path.join(entityDir, ...symbol.metadata.namespace);

    return {
      dir: dir,
      fileName: symbol.metadata.name,
      path: path.join(dir, `${symbol.metadata.name}.json`),
      value: JSON.stringify(symbol.value),
    };
  });
}
