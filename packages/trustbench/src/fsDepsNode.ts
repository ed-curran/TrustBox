import { FsReadDeps, FsWriteDeps, PathDeps } from './fsDeps';
import * as fsPromises from 'fs/promises';
import fs from 'fs';
import path from 'path';

type FSPromisesModule = typeof fsPromises;
type PathModule = typeof path;

// const mkdirRecursive = (fsPromises: FSPromisesModule) => {
//   const exists = (dir: string) =>
//     fsPromises.stat(dir).then(
//       (stats) => stats.isDirectory(),
//       () => false
//     );
//
//   return async (dir: string): Promise<string | undefined> => {
//     if (await exists(dir)) {
//       await fsPromises.mkdir(dir);
//     }
//     return undefined;
//   };
// };

export const nodeFsWriteDeps: (fs: FSPromisesModule) => FsWriteDeps = (fs) => ({
  writeFile: fs.writeFile,
  mkdir: fs.mkdir,
  unlink: fs.unlink,
  mkdirRecursive: (path: string) => fs.mkdir(path, { recursive: true }),
  rm: fs.rm,
});

export const nodeFsReadDeps: (fs: FSPromisesModule) => FsReadDeps = (fs) => ({
  stat: (path: string) => fs.stat(path),
  readdir: (path: string) => fs.readdir(path),
  readFile: (path: string) =>
    fs.readFile(path).then((buffer) => buffer.toString('utf-8')),
});

export const nodePathDeps: (path: PathModule) => PathDeps = (path) => ({
  join: path.join,
});
