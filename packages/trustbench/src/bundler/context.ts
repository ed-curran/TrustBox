import {
  CredentialSchema,
  CredentialSchemaSymbol,
  NamedSymbol,
  Subject,
  SubjectSymbol,
  SymbolMetadata,
  TemplateSymbol,
  Topic,
  TopicSymbol,
  TrustEstablishmentDoc,
  TrustEstablishmentDocSymbol,
  TrustFramework,
  TrustFrameworkSymbol,
} from '../modelSymbol';
import { DidConfigurationConfig } from '../environment';
import { SymbolPool } from './symbolPool';

type IdContext = {
  id: string;
};

export type TrustDocContext = {
  readonly type: TrustEstablishmentDocSymbol['type'];
  readonly context: {
    readonly id: string;
    readonly publisherDid: string | undefined;
    readonly version: string;
  };
  readonly value: TrustEstablishmentDoc;
};
export type TopicContext = {
  readonly type: TopicSymbol['type'];
  readonly context: IdContext;
  readonly value: Topic;
};
type CredentialSchemaContext = {
  readonly type: CredentialSchemaSymbol['type'];
  readonly context: IdContext;
  value: CredentialSchema;
};
type SubjectContext = {
  readonly type: SubjectSymbol['type'];
  readonly context: {
    id: string;
    externalDid?: string;
  };
  readonly value: Subject;
};
type TemplateContext = {
  type: TemplateSymbol['type'];
  readonly context: IdContext; //this isn't used. why do we need this
  readonly value: TemplateSymbol['value'];
};
type TrustFrameworkContext = {
  type: TrustFrameworkSymbol['type'];
  readonly context: {
    id: string;
    trustDoc: TrustDocContext['context'];
  }; //this isn't used. why do we need this
  readonly value: TrustFrameworkSymbol['value'];
};
export type SymbolWithContext =
  | CredentialSchemaContext
  | TopicContext
  | TrustDocContext
  | SubjectContext
  | TemplateContext
  | TrustFrameworkContext;

export type SymbolContextMetadata = {
  readonly name: string;
  readonly entityName: string;
  readonly namespace: readonly string[];
  readonly path: string;
  readonly extension: string;
  readonly raw: string; //should try to avoid passing this through tbh
};

export type NamedContext<T> = T & {
  metadata: SymbolContextMetadata;
};

export type NamedSymbolWithContext = NamedContext<SymbolWithContext>;

export type EntityContext = {
  name: string;
  did: string;
  origin: string | undefined;
  //we're duplicating environment config into here and it seems dumb, why are we not just passing environment through
  didConfiguration: DidConfigurationConfig | boolean | undefined;
  additionalOutDir: string | undefined;
  //this feels wrong tbh
  subjects: {
    ref: string;
  }[];

  //hacky temporary field to handle web5 instance using a different did
  //todo: either get veramo and web5 to use the same did
  //or add proper multi did support
  publisherDid?: string;
};

export type Context = {
  environmentName: string;
  entities: Map<string, EntityContext>;
  publishWithWeb5: boolean;
  pool: SymbolPool;
};

export type EntityWithContext = {
  context: EntityContext;
  symbols: NamedSymbolWithContext[];
};

export function withContext<S extends NamedSymbol>(
  symbol: S,
  entityName: string,
  context: Extract<NamedSymbolWithContext, { type: S['type'] }>['context'],
): Extract<NamedSymbolWithContext, { type: S['type'] }> {
  return {
    type: symbol.type,
    value: symbol.value,
    context,
    metadata: toContextMetadata(entityName, symbol.metadata),
  } as Extract<NamedSymbolWithContext, { type: S['type'] }>;
}

export function toContextMetadata(
  entityName: string,
  symbolMetadata: SymbolMetadata,
): SymbolContextMetadata {
  return {
    name: symbolMetadata.name,
    path: symbolMetadata.path,
    namespace: symbolMetadata.namespace,
    entityName: entityName,
    extension: symbolMetadata.extension,
    raw: symbolMetadata.raw,
  };
}

//deprecate this probably
export function symbolPath(entityContext: EntityContext, symbol: NamedSymbol) {
  return metadataPath(entityContext, symbol.metadata);
}

export function metadataPath(
  entityContext: EntityContext,
  metadata: SymbolMetadata,
) {
  return `${entityContext.origin ? `${entityContext.origin}/` : ''}${
    metadata.namespace.length > 0 ? metadata.namespace.join('/') + '/' : ''
  }${metadata.name}.${metadata.extension}`; //todo: output extension may not always be same as input
}

export function metadataDir(
  entityContext: EntityContext,
  metadata: SymbolMetadata,
) {
  return `${entityContext.origin ? `${entityContext.origin}/` : ''}${
    metadata.namespace.length > 0 ? metadata.namespace.join('/') : ''
  }`; //todo: output extension may not always be same as input
}
