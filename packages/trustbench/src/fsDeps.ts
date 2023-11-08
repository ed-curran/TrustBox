import type { ObjectEncodingOptions } from 'node:fs';

//simplified fs functions, we just use strings to represent path, and string for buffers
//why? so that we can do browser stuff
export type FsWriteDeps = {
  mkdir: (
    dir: string,
    options: { recursive: boolean }
  ) => Promise<string | undefined>;
  mkdirRecursive: (dir: string) => Promise<string | undefined>;
  writeFile: (
    path: string,
    contents: string,
    options?: ObjectEncodingOptions
  ) => Promise<void>;
  unlink: (path: string) => Promise<void>;
  rm: (path: string, options?: { recursive: boolean }) => Promise<void>;
};

export type FsStats = {
  isDirectory: () => boolean;
};
export type PathDeps = {
  join: (...paths: string[]) => string;
};
export type FsReadDeps = {
  readFile: (path: string) => Promise<string>;
  stat: (path: string) => Promise<FsStats>;
  readdir: (path: string) => Promise<string[]>;
};

export type FsEntry = {
  parents: string[];
  name: string;
  path: string;
};

export async function mkDirIfNotExists(
  dir: string,
  f: FsWriteDeps,
  existingDirs: Set<string>
) {
  if (!existingDirs.has(dir)) {
    try {
      await f.mkdir(dir, { recursive: true });
    } catch (e: any) {
      //error handling in typescript sucks ass
      if (e.code !== 'EEXIST') {
        //dir already exists, this is fine
        console.log(e);
        throw e;
      }
    }
  }
  existingDirs.add(dir);
}
