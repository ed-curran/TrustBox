import { JsonSchema, SubjectEntry } from './bundler/trustEstablishmentDoc';

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

//each key is a topic id and the value is a set of assertions (aka a json object) that apply this this subject
export type Subject = Record<string, Record<string, unknown>>;

export type SubjectSymbol = {
  type: 'Subject';
  value: Subject;
};

export type Symbol = TopicSymbol | SubjectSymbol | TrustEstablishmentDocSymbol;
export type NamedSymbol = Named<Symbol>;
export type SymbolTag = Symbol['type'];

export type Named<T> = T & {
  metadata: SymbolMetadata;
};

export type SymbolMetadata = {
  readonly name: string;
  readonly namespace: readonly string[];
  readonly path: string;
};

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
