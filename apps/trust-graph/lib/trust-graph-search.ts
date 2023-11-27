import type { GraphNode } from "reagraph";
import type { Web5 } from "@web5/api";
import type {
  Triple,
  TrustEstablishmentDoc} from "trustlib";
import {
  aggregatedEdgeId,
  toTriples
} from "trustlib";
import type { GraphElementBaseAttributes } from "reagraph/dist/types";

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
  nodes: Set<string>;
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


export async function search(
  nodeFilter: ValidFilter,
  web5: Web5,
  graph: IndexedGraph,
  listeners: {
    onUpdateEdges: (edges: TrustGraphEdge[]) => void;
    onUpdateNodes: (nodes: GraphNode[]) => void;
    onUpdateDocs: (docs: TrustEstablishmentDoc[]) => void;
    onComplete: () => void;
  },
) {
  const didResolutionResult = await web5.did.resolve(nodeFilter.value).catch(() => undefined)
  if(!didResolutionResult?.didDocument) {
    listeners.onComplete();
    return;
  }
  const _linkedDomains: string[] = didResolutionResult.didDocument.service ? didResolutionResult.didDocument.service.flatMap((serviceEntry) => {
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
  // console.log(linkedDomains)
  //todo validate domains
  //need to do an explicit add
  const foundDocs = await fetchDocsFromDwn(nodeFilter.value, web5);
  if (foundDocs.length > 0) listeners.onUpdateDocs(foundDocs);
  else {
    listeners.onComplete();
    return;
  }

  const triples = foundDocs.flatMap((doc) => toTriples(doc));
  const { indexedGraph: mergedGraph, newSubjects } = merge(graph, triples);

  listeners.onUpdateNodes(mergedGraph.graph.nodes.slice());
  listeners.onUpdateEdges(mergedGraph.graph.edges.slice());

  await Promise.all(
    newSubjects.map((subjectId) =>
      search({ type: "did", value: subjectId }, web5, mergedGraph, listeners),
    ),
  );
  listeners.onComplete();
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
      const graph = agg.indexedGraph.graph;
      const seen = agg.indexedGraph.seen;

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

      if (!seen.nodes.has(triple.object)) {
        seen.nodes.add(triple.object);
        graph.nodes.push({
          id: triple.object,
          label: truncateDid(triple.object),
          size: 40
        });
      }
      if (!seen.nodes.has(triple.subject)) {
        seen.nodes.add(triple.subject);
        agg.newSubjects.push(triple.subject);
        graph.nodes.push({
          id: triple.subject,
          label: truncateDid(triple.subject),
          size: 40
        });
      }

      return agg;
    },
    {
      indexedGraph: initial,
      newSubjects: new Array<string>(),
    },
  );
}

function truncateDid(str: string, n = 36) {
  return str.length > n ? `${str.slice(0, n - 1)  }...` : str;
}

export function newIndexedGraph() {
  return {
    graph: {
      nodes: new Array<GraphNode>(),
      edges: new Array<TrustGraphEdge>(),
    },
    seen: {
      nodes: new Set<string>(),
      edges: new Map<string, number>(),
    },
  };
}

// function diffGraph(seen: GraphIndex, triples: Triple[]) {
//   return merge(
//     {
//       graph: {
//         nodes: [],
//         edges: [],
//       },
//       seen: {
//         nodes: seen.nodes,
//         edges: seen.edges,
//       },
//     },
//     triples,
//   ).indexedGraph;
// }
// let globalSeen = newIndexedGraph().seen;
// async function searchOld(
//   nodeFilter: ValidFilter,
//   web5: Web5,
//   seen: GraphIndex,
//   listeners: {
//     onUpdateEdges: (edges: TrustGraphEdge[]) => void;
//     onUpdateNodes: (nodes: GraphNode[]) => void;
//     onUpdateDocs: (docs: TrustEstablishmentDoc[]) => void;
//     onComplete: () => void;
//   },
// ) {
//   if (seen.nodes.has(nodeFilter.value)) return;
//
//   const foundDocs = await fetchDocsFromDwn(nodeFilter.value, web5);
//   if (foundDocs.length > 0) listeners.onUpdateDocs(foundDocs);
//
//   const triples = foundDocs.flatMap((doc) => toTriples(doc));
//   const diff = diffGraph(seen, triples);
//   if (diff.graph.nodes.length > 0) {
//     listeners.onUpdateNodes(diff.graph.nodes);
//   }
//   if (diff.graph.edges.length > 0) {
//     listeners.onUpdateEdges(diff.graph.edges);
//   }
//
//   await Promise.all(
//     diff.graph.nodes.map((node) =>
//       search({ type: "did", value: node.id }, web5, diff.seen, listeners),
//     ),
//   );
//   listeners.onComplete();
// }
