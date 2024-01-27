import { Triple } from './trustTriple';

export type TrustEstablishmentDoc<T extends Entries = Entries> = {
  id: string;
  author: string;
  //timestamp
  created: string;
  //timestamp
  validFrom: string;
  version: string;
  entries: T;

  //hacky custom field we use for dwn location
  publisherDid?: string;
};

export type Entries = Record<string, TopicEntry<Record<string, unknown>>>;
export type TopicEntry<T extends Record<string, unknown>> = Record<
  string,
  SubjectEntry<T>
>;
export type SubjectEntry<
  T extends Record<string, unknown> = Record<string, unknown>,
> = T;

//todo better handling of different json schema versions
export type JsonSchema = {
  $id: string;
  $schema: string;
  title: string;
  type: string;
  properties: Record<string, unknown>;
};

export function toTriples(
  doc: TrustEstablishmentDoc,
): Triple<{ docId: string; assertions: SubjectEntry }>[] {
  return Object.entries(doc.entries).flatMap(([schemaId, schemaEntry]) =>
    Object.entries(schemaEntry).flatMap(([subjectId, subjectEntry]) => ({
      subject: subjectId,
      object: doc.author,
      predicate: schemaId,
      //level graph keeps metadata inline in the triple object
      docId: doc.id,
      assertions: subjectEntry,
    })),
  );
}

export function toTopics(doc: TrustEstablishmentDoc) {
  return Object.entries(doc.entries).map(([topicId]) => topicId);
}

export function toUniqueTopics(docs: TrustEstablishmentDoc[]) {
  return docs.reduce(
    (agg, current) => {
      toTopics(current).forEach((topic) => {
        if (!agg.seen.has(topic)) {
          agg.topics.push(topic);
          agg.seen.add(topic);
        }
      });

      return agg;
    },
    { topics: new Array<string>(), seen: new Set() },
  ).topics;
}

export type TrustDocSummary = {
  doc: TrustEstablishmentDoc;
  source: string | undefined;
  topics: {
    id: string;
    title: string;
  }[];
  assertionsCount: number;
  uniqueSubjectsCount: number;
};

export function summariseDoc(
  doc: TrustEstablishmentDoc,
  topicSchemas: Map<string, JsonSchema>,
) {
  const metrics = Object.entries(doc.entries).reduce(
    (agg, [topic]) => {
      Object.entries(topic).forEach(([subjectId]) => {
        agg.assertionsCount++;
        if (!agg.seenSubjects.has(subjectId)) {
          agg.uniqueSubjectsCount++;
          agg.seenSubjects.add(subjectId);
        }
      });
      return agg;
    },
    {
      assertionsCount: 0,
      uniqueSubjectsCount: 0,
      seenSubjects: new Set<string>(),
    },
  );
  return {
    doc,
    uniqueSubjectsCount: metrics.uniqueSubjectsCount,
    assertionsCount: metrics.assertionsCount,
    topics: Object.entries(doc.entries).map(([topicId]) => ({
      id: topicId,
      title: topicSchemas.get(topicId)?.title ?? topicId,
    })),
  };
}
