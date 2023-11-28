import type {GraphNode} from "reagraph";
import type {Web5} from "@web5/api";
import type {Triple, TrustEstablishmentDoc} from "trustlib";
import {aggregatedEdgeId, toTriples} from "trustlib";
import type {GraphElementBaseAttributes} from "reagraph/dist/types";
import type { WellKnownDidVerifier} from '@sphereon/wellknown-dids-client';
import {ValidationStatusEnum} from '@sphereon/wellknown-dids-client'

export interface TrustGraphEdge
  extends GraphElementBaseAttributes<{ count: number }> {
  source: string;
  target: string;
}

export interface TrustGraph {
  nodes: GraphNode[];
  edges: TrustGraphEdge[];
}

interface GraphIndex {
  nodes: Map<string, number>;
  edges: Map<string, number>;
}
//this is annoying, if this reagraph gave us access to the underlying grapholgy data structure we wouldn't need to do this
interface IndexedGraph {
  graph: TrustGraph;
  seen: GraphIndex;
}

export interface ValidFilter {
  type: "did";
  value: string;
}

//this is just a graph traversal
//except its somewhat tricky because we're building the graph as we go and its async.
//we take a greedy approach to adding nodes as soon we see them, so that we can start rendering stuff as soon as possible
//it also helps keep the graph consistent e.g. edges always have nodes when the listeners are called.
//this adds the need to go back and  update details (like linked domain) of nodes we've already added
//which is the ugliest part.
export async function search(
  nodeFilter: ValidFilter,
  web5: Web5,
  verifier: WellKnownDidVerifier,
  graph: IndexedGraph,
  listeners: {
    onUpdateEdges: (edges: TrustGraphEdge[]) => void;
    onUpdateNodes: (nodes: GraphNode[]) => void;
    onUpdateDocs: (docs: TrustEstablishmentDoc[]) => void;
  },
) {
  const linkedDomains = await fetchLinkedDomains(nodeFilter.value, web5, verifier)
  //undefined here means we couldn't even resolve the did doc which is a bad sign
  if(!linkedDomains) return

  const origin: string | undefined = linkedDomains[0]
  //we may have already seen this entity, in which case this will update it with an origin
  putEntity(graph, {did: nodeFilter.value, origin})
  listeners.onUpdateNodes(graph.graph.nodes)

  //todo validate domains
  //need to do an explicit add
  const foundDocs = await fetchDocsFromDwn(nodeFilter.value, web5);
  if(foundDocs.length === 0) return

  listeners.onUpdateDocs(foundDocs);

  const triples = foundDocs.flatMap((doc) => toTriples(doc));
  const { indexedGraph: mergedGraph, newSubjects } = merge(graph, triples);

  listeners.onUpdateNodes(mergedGraph.graph.nodes.slice());
  listeners.onUpdateEdges(mergedGraph.graph.edges.slice());

  await Promise.allSettled(
    newSubjects.map((subjectId) =>
      search({ type: "did", value: subjectId }, web5, verifier, mergedGraph, listeners),
    ),
  );
}

//use the did doc to find any linked domains
//https://identity.foundation/.well-known/resources/did-configuration/#linked-domain-service-endpoint
async function fetchLinkedDomains(did: string, web5: Web5, verifier: WellKnownDidVerifier): Promise<string[] | undefined> {
  const didResolutionResult = await web5.did.resolve(did).catch(() => undefined)
  if(!didResolutionResult?.didDocument) {
    return undefined;
  }

  //todo verify these domains with welknown did configuration
  const linkedDomains = didResolutionResult.didDocument.service ? didResolutionResult.didDocument.service.flatMap((serviceEntry) => {
    if(serviceEntry.type === 'LinkedDomains') {
      const serviceEndpoint = serviceEntry.serviceEndpoint
      if(typeof serviceEndpoint === 'string') return [serviceEndpoint]
      if(typeof serviceEndpoint === 'object'
        && !Array.isArray(serviceEndpoint)
        && Object.hasOwn(serviceEndpoint, 'origin')
        && Array.isArray(serviceEndpoint.origin)
      ) {
        //i guess i could figure out how to narrow this properly
        return serviceEndpoint.origin as string[]
      }
      return []
    }
    return []

  }) : []

  //can't figure out how to do this with a single flatmap
  //cus the promises get in the way
  const validatedDomains = await Promise.all(linkedDomains.map(async domain => {
    const result = await verifier.verifyResource({origin: domain}).catch(() => {
      return undefined
    })
    if(!result) return undefined
    if(result.status === ValidationStatusEnum.INVALID) {
      return undefined
    }
    return domain
  }))

  return validatedDomains.flatMap(validatedDomain => validatedDomain ? [validatedDomain] : [])
}

async function fetchDocsFromDwn(
  did: string,
  web5: Web5,
): Promise<TrustEstablishmentDoc[]> {
  const result = await web5.dwn.records
    .query({
      from: did,
      message: {
        filter: {
          schema:
            "https://github.com/decentralized-identity/trust-establishment/blob/main/versions/v1/schemas/schema.json",
          dataFormat: "application/json",
        },
      },
    })
    .catch(() => undefined);
  const records = result?.records;
  if (!records) return [];

  return Promise.all(
    records.map(
      (record) => record.data.json() as Promise<TrustEstablishmentDoc>,
    ),
  );
}

function merge(initial: IndexedGraph, triples: Triple[]) {
  return triples.reduce(
    (agg, triple) => {
      //by adding all these together we ensure we get a minimal renderable graph
      addAssertionTriple(agg.indexedGraph, triple)
      addEntity(agg.indexedGraph, {did: triple.object})
      const isNewSubject = addEntity(agg.indexedGraph, {did: triple.subject})

      if (isNewSubject) {
        //these are the children that we're going to traverse next
        agg.newSubjects.push(triple.subject);
      }

      return agg;
    },
    {
      indexedGraph: initial,
      newSubjects: new Array<string>(),
    },
  );
}

export function truncateDid(str: string, n = 36) {
  return str.length > n ? `${str.slice(0, n - 1)  }...` : str;
}

export function newIndexedGraph(): IndexedGraph {
  return {
    graph: {
      nodes: new Array<GraphNode>(),
      edges: new Array<TrustGraphEdge>(),
    },
    seen: {
      nodes: new Map<string, number>(),
      edges: new Map<string, number>(),
    },
  };
}

//yeah this stuff should co-located with the data structure probably

//an assertion triple is combined with other triples of the same object and subject
//to create a single weighted edge
//
function addAssertionTriple({graph, seen}: IndexedGraph, triple: Triple) {
  //todo: theres a bug in deduping and counting the edges
  const edgeId = aggregatedEdgeId(triple);
  const existingEdgeIndex = seen.edges.get(edgeId);

  if (existingEdgeIndex) {
    const existingEdge = graph.edges[existingEdgeIndex];
    const count = existingEdge.data ? existingEdge.data.count + 1 : 1;
    graph.edges[existingEdgeIndex] = {
      id: edgeId,
      source: existingEdge.source,
      target: existingEdge.target,
      label: count.toString(),
      size: count,
      data: {
        count,
      },
    };
  } else {
    const count = 1;
    graph.edges.push({
      id: edgeId,
      source: triple.object,
      target: triple.subject,
      label: count.toString(),
      size: count,
      data: {
        count,
      },
    });
    seen.edges.set(edgeId, graph.edges.length - 1);
  }
}

//an entity is represented by a node in the graph
//create entity or do nothing if its already been seen
function addEntity({seen, graph}: IndexedGraph, entity: {did: string, origin?: string}) {
  const host = entity.origin ? new URL(entity.origin).host : undefined
  if(seen.nodes.has(entity.did)) return false
  graph.nodes.push({
    id: entity.did,
    label: host,
    size: 40
  });
  seen.nodes.set(entity.did, graph.nodes.length - 1);
  return true
}

//create or update an entity
function putEntity({graph, seen}: IndexedGraph, entity: {did: string, origin?: string}) {
  const host = entity.origin ? new URL(entity.origin).host : undefined
  const existingIndex = seen.nodes.get(entity.did)
  if(!existingIndex) {
    graph.nodes.push({
      id: entity.did,
      label: host,
      size: 40
    });
    seen.nodes.set(entity.did, graph.nodes.length - 1);
    return
  }
  if(existingIndex >= graph.nodes.length) return false
  const existingNode = graph.nodes[existingIndex]

  graph.nodes[existingIndex] = {
    id: existingNode.id,
    label: host,
    size: existingNode.size
  }
}