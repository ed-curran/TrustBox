export class SprightlyError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export interface Options {
  keyFallback?: string;
  throwOnKeyNotfound?: boolean;
  cache?: boolean;
}

export function resolveReferences(
  fileContent: string,
  filePath: string,
  get: (key: string) => string | undefined,
  options: Options = defaultOptions,
) {
  return fileContent.replaceAll(/\{\{(.*?)\}\}/g, (_, reference: string) => {
    reference = reference.trim();

    const value = get(reference);

    if (value === undefined && options.throwOnKeyNotfound) {
      throw new SprightlyError(
        `Key "${reference}" was not found at "${filePath}"`,
      );
    }

    return value ?? '';
  });
}

const defaultOptions = {
  keyFallback: '',
  throwOnKeyNotfound: false,
  cache: false,
};
