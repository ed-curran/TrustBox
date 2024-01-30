import {
  ModelSymbol,
  SymbolMetadata,
  SymbolTag,
  Named,
  NamedSymbol,
  Topic,
  Subject,
  TrustEstablishmentDoc,
  Optional,
  TrustFramework,
} from './modelSymbol';
import { FsEntry, FsReadDeps, PathDeps } from './fsDeps';

function toRelativePath(
  name: string,
  namespace: readonly string[],
  type: string,
  extension: string,
) {
  const symbolDir = namespace.join('/');
  const fileName = `${name}.${type}.${extension}`;
  return `${symbolDir}/${fileName}`;
}

//todo better name
export type LoadedEntity = {
  entity: {
    name: string;
  };
  symbols: NamedSymbol[];
};

export async function loadEntities(
  dir: string,
  fs: FsReadDeps,
  path: PathDeps,
): Promise<LoadedEntity[]> {
  const directories = await scanDirectoryForDirectories(dir, fs, path);
  const entities = directories.map(async (dir) => {
    const entityName = dir.name;
    return {
      entity: { name: entityName },
      symbols: await loadSymbols(dir.path, fs, path),
    };
  });
  return Promise.all(entities);
}

export async function loadSymbols(
  dir: string,
  fs: FsReadDeps,
  path: PathDeps,
): Promise<NamedSymbol[]> {
  const files = await walkDir(dir, fs, path);
  const readFile = (path: string) =>
    fs.readFile(path).then((bytes) => bytes.toString());

  //type inference is struggling
  const maybeSymbols: (NamedSymbol | undefined)[] = await Promise.all(
    files.map((file) => toSymbol(file, readFile)),
  );

  return maybeSymbols.flatMap((symbol) => symbol ?? []);
}

async function toSymbol(
  entry: FsEntry,
  fileReader: (path: string) => Promise<string>,
): Promise<NamedSymbol | undefined> {
  const parts = entry.name.split('.');
  const symbolType = parts[parts.length - 2];
  const symbolExtension = parts[parts.length - 1];
  const name = parts[0] as string | undefined;
  if (!name) return undefined;
  if (!symbolType) return undefined;
  if (!symbolExtension) return undefined;

  const symbolTag = classifyFile(symbolType);
  if (!symbolTag) return undefined;

  //const namespace = Array.from(entry.parents)
  const contents = await fileReader(entry.path);

  //we could get the path from the actual filesystem path
  //but instead we derive it from the symbol to be consistent,
  // the idea is we should be doing it this way everywhere
  const serde = symbolSerde({ type: symbolTag }, symbolExtension);
  const namespace = Array.from(entry.parents);
  //we actually rarely use path itself, instead preferring to derive it
  //maybe we should just not store it in metadata
  const path = toRelativePath(name, namespace, serde.type, serde.extension);

  const result = await serde.deserialize(contents, {
    name,
    path,
    namespace,
    extension: serde.extension,
    raw: contents,
  });
  if (result.status === 'failure') return undefined;
  return result.value;
}

export type Result<T> =
  | {
      status: 'success';
      value: T;
    }
  | { status: 'failure'; message: string };

type SymbolSerde = {
  extension: string;
  type: string;
  deserialize: (
    contents: string,
    metadata: SymbolMetadata,
  ) => Promise<Result<Named<ModelSymbol>>>;
  serialize: () => Promise<Result<string>>;
};

const removeUndefineds = <T extends Record<string, any>>(obj: T): T => {
  Object.keys(obj).forEach((key: keyof T) => {
    const value = obj[key];
    if (value === undefined) delete obj[key];
    else if (typeof value === 'object') removeUndefineds(value); //recurse deeper
  });

  return obj;
};

export function classifyFile(symbolType: string): SymbolTag | undefined {
  switch (symbolType) {
    case 'topic':
      return 'Topic';
    case 'trustestablishment':
      return 'TrustEstablishmentDoc';
    case 'subject':
      return 'Subject';
    case 'credschema':
      return 'CredentialSchema';
    case 'template':
      return 'Template';
    case 'tf':
      return 'TrustFramework';
    default:
      return undefined;
  }
}

export function classifySymbol(symbolTag: SymbolTag) {
  //todo: do json schema validation
  switch (symbolTag) {
    case 'TrustEstablishmentDoc': {
      return {
        extension: 'json',
        type: 'trustestablishment',
      };
    }
    case 'Topic': {
      return {
        extension: 'json',
        type: 'topic',
      };
    }
    case 'CredentialSchema': {
      return {
        extension: 'json',
        type: 'credschema',
      };
    }
    case 'Subject': {
      return {
        extension: 'json',
        type: 'subject',
      };
    }
    case 'Template': {
      return {
        extension: '',
        type: 'template',
      };
    }
    case 'TrustFramework': {
      return {
        extension: 'json',
        type: 'tf',
      };
    }
  }
}

//need to sort out how we're dealing with file extensions
export function symbolSerde(
  symbol: Optional<ModelSymbol, 'value'>,
  extension?: string,
): SymbolSerde {
  //todo: do json schema validation
  switch (symbol.type) {
    case 'TrustEstablishmentDoc': {
      return {
        extension: 'json',
        type: 'trustestablishment',
        deserialize: async (contents, metadata) => {
          const entity = JSON.parse(contents) as TrustEstablishmentDoc;
          return {
            status: 'success',
            value: {
              type: 'TrustEstablishmentDoc',
              value: entity,
              metadata,
            },
          } as const;
        },
        serialize: async () => {
          const contents = JSON.stringify(symbol.value, null, 2);
          return {
            status: 'success',
            value: contents,
          } as const;
        },
      };
    }
    case 'Topic': {
      return {
        extension: 'json',
        type: 'topic',
        deserialize: async (contents, metadata) => {
          const topic = JSON.parse(contents) as Topic;
          return {
            status: 'success',
            value: {
              type: 'Topic',
              value: topic,
              metadata,
            },
          } as const;
        },
        serialize: async () => {
          const contents = JSON.stringify(symbol.value, null, 2);
          return {
            status: 'success',
            value: contents,
          } as const;
        },
      };
    }
    case 'CredentialSchema': {
      return {
        extension: 'json',
        type: 'credschema',
        deserialize: async (contents, metadata) => {
          const topic = JSON.parse(contents) as Topic;
          return {
            status: 'success',
            value: {
              type: 'CredentialSchema',
              value: topic,
              metadata,
            },
          } as const;
        },
        serialize: async () => {
          const contents = JSON.stringify(symbol.value, null, 2);
          return {
            status: 'success',
            value: contents,
          } as const;
        },
      };
    }
    case 'Subject': {
      return {
        extension: 'json',
        type: 'subject',
        deserialize: async (contents, metadata) => {
          const subject = JSON.parse(contents) as Subject;
          return {
            status: 'success',
            value: {
              type: 'Subject',
              value: subject,
              metadata,
            },
          } as const;
        },
        serialize: async () => {
          const contents = JSON.stringify(symbol.value, null, 2);
          return {
            status: 'success',
            value: contents,
          } as const;
        },
      };
    }
    case 'Template': {
      return {
        extension: extension ?? '',
        type: 'template',
        deserialize: async (contents, metadata) => {
          return {
            status: 'success',
            value: {
              type: 'Template',
              value: contents,
              metadata,
            },
          } as const;
        },
        serialize: async () => {
          return {
            status: 'success',
            value: symbol.value as string, //gross - the typing of this whole function needs fixed
          } as const;
        },
      };
    }
    case 'TrustFramework': {
      return {
        extension: 'json',
        type: 'tf',
        deserialize: async (contents, metadata) => {
          const entity = JSON.parse(contents) as TrustFramework;
          return {
            status: 'success',
            value: {
              type: 'TrustFramework',
              value: entity,
              metadata,
            },
          } as const;
        },
        serialize: async () => {
          const contents = JSON.stringify(symbol.value, null, 2);
          return {
            status: 'success',
            value: contents,
          } as const;
        },
      };
    }
  }
}

async function scanDirectoryForDirectories(
  dir: string,
  fsPromises: FsReadDeps,
  path: PathDeps,
  parents: string[] = [],
): Promise<FsEntry[]> {
  const files = await fsPromises.readdir(dir);
  const dirPaths = files.map(async (name): Promise<FsEntry | undefined> => {
    const thingPath = path.join(dir, name);
    const stat = await fsPromises.stat(thingPath);
    if (stat.isDirectory()) {
      return {
        parents,
        name: name,
        path: thingPath,
      };
    } else {
      return undefined;
    }
  });
  const directories = await Promise.all(dirPaths);
  return directories.filter((dir): dir is FsEntry => dir !== undefined);
}

async function walkDir(
  dir: string,
  fsPromises: FsReadDeps,
  path: PathDeps,
  parents: string[] = [],
): Promise<FsEntry[]> {
  const files = await fsPromises.readdir(dir);
  const dirPaths = files.map(async (name): Promise<FsEntry[]> => {
    const thingPath = path.join(dir, name);
    const stat = await fsPromises.stat(thingPath);
    //its actually important we do a copy here
    if (stat.isDirectory())
      return walkDir(thingPath, fsPromises, path, [...parents, name]);
    return [
      {
        parents,
        name: name,
        path: thingPath,
      },
    ];
  });
  return Promise.all(dirPaths).then((paths) => paths.flat());
}
