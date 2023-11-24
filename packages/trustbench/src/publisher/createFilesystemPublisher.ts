import {Publisher} from './publisher'
import {FsWriteDeps, PathDeps} from '../fsDeps'
import {bundleToWriteCommand, entityToCommands, writeBundle, writeEntity} from './bundleWriter'

type Deps = {
  f: FsWriteDeps;
  path: PathDeps;
};

//todo move bundleWrite contents into here
export const createFilesystemPublisher = (fsDeps: Deps, outDir: string): Publisher => {
  return {
    async publishBundle(bundle, environmentLock) {
      const command = bundleToWriteCommand(outDir, bundle, environmentLock, fsDeps.path);
      await writeBundle(command, fsDeps);
    },
    async publishEntity(entity) {
      const entityDir = fsDeps.path.join(outDir, entity.name);

      const command = {
        entityDir,
        commands: entityToCommands(outDir, entity, fsDeps.path),
        lockCommands: [],
        additionalOutDir: entity.additionalOutDir
      }

      await writeEntity('', command, fsDeps);
    }
  }
}