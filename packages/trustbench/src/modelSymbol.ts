import { JsonSchema } from './trustlib';

export interface Entity {}

export type EntitySymbol = {
  type: 'Entity';
  value: Entity;
};

export type Topic = JsonSchema;

export type TopicSymbol = {
  type: 'Topic';
  value: Topic;
};

export type TrustEstablishmentDoc = {
  topics: string[];
};

export type TrustEstablishmentDocSymbol = {
  type: 'TrustEstablishmentDoc';
  value: TrustEstablishmentDoc;
};

export type CredentialSchema = JsonSchema;
export type CredentialSchemaSymbol = {
  type: 'CredentialSchema';
  value: CredentialSchema;
};

//each key is a topic id and the value is a set of assertions (aka a json object) that apply this this subject
export type Subject = Record<string, Record<string, unknown>>;

export type SubjectSymbol = {
  type: 'Subject';
  value: Subject;
};

export type TemplateSymbol = {
  type: 'Template';
  value: string;
};

export type TrustFramework = {
  trustEstablishmentDoc: {
    credentialsTopic: string;
    memberTopic: string;
    issuerTopic: string;
    verifierTopic: string;
    topics: string[] | undefined;
  };
  staticApi:
    | {
        extensionlessEndpoints: boolean;
      }
    | undefined
    | boolean;
};
export type TrustFrameworkSymbol = {
  type: 'TrustFramework';
  value: TrustFramework;
};

export type ModelSymbol =
  | TopicSymbol
  | SubjectSymbol
  | TrustEstablishmentDocSymbol
  | CredentialSchemaSymbol
  | TemplateSymbol
  | TrustFrameworkSymbol;
export type NamedSymbol = Named<ModelSymbol>;
export type SymbolTag = ModelSymbol['type'];

export type Named<T> = T & {
  metadata: SymbolMetadata;
};

export type SymbolMetadata = {
  readonly name: string;
  readonly namespace: readonly string[];
  readonly path: string;
  readonly extension: string;
  readonly raw: string; //the raw file data as utf8 string
};

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
