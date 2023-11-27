"use-client";

import type {SvgProps, GraphCanvasRef, GraphNode } from 'reagraph'
import React, { useEffect, useRef, useState } from "react";
import { Web5 } from "@web5/api";
import type { TrustEstablishmentDoc } from "trustlib";
import { StringParam, useQueryParam } from "use-query-params";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import {toSvg} from "jdenticon";
import { cn } from "@/lib/utils";
import {
  newIndexedGraph,
  search
} from "@/lib/trust-graph-search";
import type {
  TrustGraphEdge,
  ValidFilter} from "@/lib/trust-graph-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GraphCanvas = dynamic(
  () => import("reagraph").then((dep) => dep.GraphCanvas),
  { ssr: false },
);


const SphereWithIcon = dynamic(
  () => import("reagraph").then((dep) => dep.SphereWithIcon),
  { ssr: false },
);


export function TrustGraph() {
  const [filter, setFilter] = useQueryParam("filter", StringParam);

  //parsing twice :(
  const parsedFilter = filter ? parseFilter(filter) : undefined;

  return (
    <div className="px-20 py-20 flex flex-1 flex-col">
      <FilterForm
        className="px-8"
        initialValue={parsedFilter}
        onFilterSubmitted={(submittedFilter) => {
          setFilter(submittedFilter.value);
        }}
      />
      {parsedFilter && parsedFilter.type !== "unknown" ? (
        <TrustGraphViewer filter={parsedFilter} />
      ) : (
        <p>please provide a filter</p>
      )}
    </div>
  );
}

interface TrustGraphViewerProps {
  filter: ValidFilter;
}

export function TrustGraphViewer({ filter }: TrustGraphViewerProps) {
  const [web5, setWeb5] = useState<Web5 | null>(null);
  const [myDid, setMyDid] = useState<string | null>(null);

  const [docs, setDocs] = useState<TrustEstablishmentDoc[] | null>(null);
  //i'm not getting any value out of nodes and edges being seperate atm, cus they're always being updated together
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<TrustGraphEdge[]>([]);
  const [searching, setSearching] = useState<boolean>(true);

  useEffect(() => {
    Web5.connect().then(
      (connection) => {
        setWeb5(connection.web5);
        setMyDid(connection.did);
      },
      () => {
        //do nothing
      },
    );
  }, []);

  const graphRef = useRef<GraphCanvasRef | null>(null);

  useEffect(() => {
    if (!web5 || !myDid) return;
    //filter has changed, initiate new search
    setSearching(true);
    setDocs(null);
    setEdges([]);
    setNodes([]);

    void search(filter, web5, newIndexedGraph(), {
      onUpdateEdges: (newEdges) => {
        setEdges(newEdges);
      },
      onUpdateNodes: (newNodes) => {
        setNodes(newNodes);
      },
      onUpdateDocs: (newDocs) => {
        setDocs((currentDocs) => (currentDocs ?? []).concat(newDocs));
      },
      onComplete: () => {
        setSearching(false);
      },
    });
  }, [web5, myDid, filter]);

  return (
    <div className="w-full h-100% flex-1 flex">
      {searching ? (
        <p>
          <Loader2 className="h-4 w-4 animate-spin" />
          {!docs ? "searching..." : null}
        </p>
      ) : null}
      {(!searching && (!docs || docs.length === 0)) ?  <p>no trust docs found</p> : null}

      <GraphCanvas
        edges={edges}
        labelType="all"
        layoutType="treeTd2d"
        nodes={nodes}
        ref={graphRef}
        renderNode={({
                       node,
                       ...rest
                     }) => <Jdenticon {...rest} node={node} value={node.id} />
        }
      />
    </div>
  );
}

type Filter = ValidFilter | { type: "unknown"; value: string };

function parseFilter(filter: string): Filter {
  if (filter.startsWith("did")) {
    return { type: "did", value: filter };
  }
  return { type: "unknown", value: filter };
}

const UNKNOWN_FILTER_ERR = "expected did";

function FilterForm({
  className,
  initialValue,
  onFilterSubmitted,
}: {
  className?: string;
  initialValue: Filter | undefined;
  onFilterSubmitted: (filter: ValidFilter) => void;
}) {
  const [error, setError] = useState<string | null>(
    initialValue?.type === "unknown" ? UNKNOWN_FILTER_ERR : null,
  );

  return (
    <form
      className={cn("space-y-2", className)}
      onSubmit={(e) => {
        // Prevent the browser from reloading the page
        e.preventDefault();

        const formData = new FormData(e.target as HTMLFormElement);
        const filterFormData = formData.get("filter");
        if (filterFormData) {
          const result = parseFilter(filterFormData as string);
          if (result.type === "unknown") {
            setError(UNKNOWN_FILTER_ERR);
          } else {
            onFilterSubmitted(result);
            setError(null);
          }
        }
      }}
    >
      <Input
        className="text-xs"
        defaultValue={initialValue?.value}
        name="filter"
        placeholder="did or origin"
      />
      <Button size="sm" type="submit">
        Submit
      </Button>
      {error ? <label className="ml-3">{error}</label> : null}
    </form>
  );
}

export function Jdenticon({
                            value,
                            node,
                            ...rest
                          }: {
  value: string;
} & Omit<SvgProps, 'image'>) {
  const svgString = useRef<string | null>(null);
  useEffect(() => {
    if (!svgString.current) {
      svgString.current = toSvg(value, 100);
    }
  }, [value]);

  //godamn nothing is ever easy is it this took me 3 hours to figure out
  const hmm = `data:image/svg+xml;base64,${btoa(svgString.current ?? '')}`

  return (
    <SphereWithIcon
        {...rest}
        node={node}
        image={hmm}
        color={'ghostwhite'}
      />
  );
}