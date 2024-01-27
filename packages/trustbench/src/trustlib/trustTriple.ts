export type Triple<
  T extends Record<string, unknown> = Record<string, unknown>,
> = {
  subject: string;
  object: string;
  predicate: string;
} & T;

export function tripleToKey(triple: Triple) {
  //i dunno whats safe to use as a seperator tbh
  return `${triple.object}::${triple.predicate}::${triple.subject}`;
}

export function aggregatedEdgeId(triple: Triple) {
  //i dunno whats safe to use as a seperator tbh
  return `${triple.object}->${triple.subject}`;
}
