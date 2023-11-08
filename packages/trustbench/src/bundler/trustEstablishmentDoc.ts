export type TrustEstablishmentDoc<T extends Entries = Entries> = {
  id: string;
  author: string;
  //timestamp
  created: string;
  //timestamp
  validFrom: string;
  version: string;
  entries: T;
};

export type Entries = Record<string, TopicEntry<Record<string, unknown>>>;
export type TopicEntry<T extends Record<string, unknown>> = Record<
  string,
  SubjectEntry<T>
>;
export type SubjectEntry<T extends Record<string, unknown>> = T;

//todo better handling of different json schema versions
export type JsonSchema = {
  $id: string;
  $schema: string;
  title: string;
  type: string;
  properties: Record<string, unknown>;
};
