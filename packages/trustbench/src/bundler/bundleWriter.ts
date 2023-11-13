import {Bundle, BundledEntity, EnvironmentLock} from './bundler';
import { FsWriteDeps, mkDirIfNotExists, PathDeps } from '../fsDeps';
import path from 'path';

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
  additionalOutDir?: string
  entityDir: string;
  commands: WriteCommand[];

  //these are the write commands for the previous run
  //we can use them to clean up from the previous one
  //e.g. delete removed outputs
  lockCommands: WriteCommand[]
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
        path: command.path,
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

//todo figure how to not make things get fucked up if
//the write is cancelled halfway through before the lock file gets written
//or write completes but lock file write doesn't
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
    const existingDirs = new Set<string>();
    await mkDirIfNotExists(entityWriteCommand.entityDir, deps.f, existingDirs);
    await writeEntity(entityWriteCommand.entityDir, entityWriteCommand, deps, existingDirs)

    //copy to additional out dir
    if(entityWriteCommand.additionalOutDir) {
      await writeEntity(entityWriteCommand.additionalOutDir, entityWriteCommand, deps, new Set())
    }
  }
}

async function writeEntity(entityDir: string, entityWriteCommand: EntityWriteCommand, deps: Deps, existingDirs = new Set<string>()) {
  const writes: WriteCommand[] = entityWriteCommand.commands.map(command => ({
    dir: deps.path.join(entityDir, command.dir),
    path: deps.path.join(entityDir, command.path),
    value: command.value,
    fileName: command.fileName
  }))

  const results = await Promise.all(
    writes.map((command) => write(command, deps.f, existingDirs)
    )
  );

  const writtenFiles = new Set<string>()
  results.forEach((result) => {
    if (result.status === 'failure') {
      console.log(`warn: couldn't write symbol - ${result.message}`);
    } else {
      writtenFiles.add(result.path)
    }
  });

  entityWriteCommand.lockCommands.map(command => {
    if(!writtenFiles.has(command.path)) {
      deps.f.rm(command.path)
    }
  })
}
//todo delete stale outputs
//probably calculate the disjoint and turn it into DeleteCommands
//have to do this for the normal and additional output..annoying
export function bundleToWriteCommand(
  dir: string,
  bundle: Bundle,
  environmentLock: EnvironmentLock | undefined,
  path: PathDeps
): BundleWriteCommand {
   //const lockEntityMap = new Map(environmentLock.bundle.entities.map(entity => ([entity.name, entity])))
  return {
    bundleDir: dir,
    entityCommands: bundle.entities.map((entity) => {
      const entityDir = path.join(dir, entity.name);

      return {
        entityDir,
        commands: entityToCommands(entityDir, entity),
        lockCommands: [],
        additionalOutDir: entity.additionalOutDir
      };
    }),
  };
}

function entityToCommands(
  entityDir: string,
  bundle: BundledEntity
): WriteCommand[] {
  return bundle.outputSymbols.map((symbol) => {
    const dir = path.join(...symbol.metadata.namespace);

    return {
      dir: dir,
      fileName: symbol.metadata.name,
      path: path.join(dir, `${symbol.metadata.name}.json`),
      value: JSON.stringify(symbol.value, null, 2), //pretty print
    };
  });
}

// function entityToCommands(
//   entityDir: string,
//   bundle: WriteCommand
// ): WriteCommand {
//
// }