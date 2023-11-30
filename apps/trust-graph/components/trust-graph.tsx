"use-client";
import type {WellKnownDidVerifier} from '@sphereon/wellknown-dids-client'
import type {SvgProps, GraphCanvasRef, GraphNode, InternalGraphNode, CollapseProps} from 'reagraph';
import React, {memo, useEffect, useRef, useState} from "react";
import {Web5} from "@web5/api";
import type {TrustEstablishmentDoc} from "trustlib";
import {StringParam, useQueryParam} from "use-query-params";
import {Loader2} from "lucide-react";
import dynamic from "next/dynamic";
import {toSvg} from "jdenticon";
import {cn} from "@/lib/utils";
import {
  newIndexedGraph,
  search
} from "@/lib/trust-graph-search";
import type {
  TrustGraphEdge,
  ValidFilter
} from "@/lib/trust-graph-search";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {newVerifier} from '@/lib/domainverifier/verifier'

const GraphCanvas = dynamic(
  () => import("reagraph").then((dep) => dep.GraphCanvas),
  {ssr: false},
);

const SphereWithIcon = dynamic(
  () => import("reagraph").then((dep) => dep.SphereWithIcon),
  {ssr: false},
);


export function TrustGraph() {
  const [filter, setFilter] = useQueryParam("filter", StringParam);
  const parsedFilter = filter ? parseFilter(filter) : undefined;

  return (
    <div className="py-20 flex flex-1 flex-col space-y-3 ">
      <FilterForm
        className="mx-20"
        initialValue={parsedFilter}
        onFilterSubmitted={(submittedFilter) => {
          setFilter(submittedFilter.value);
        }}
      >
        {/*{searching ? <p className={'px-4 h-4 flex-none inline-flex items-center'}>*/}
        {/*  <Loader2 className="h-4 w-4 animate-spin mr-2" />*/}
        {/*  /!*{!graphInitialised ? "searching..." : null}*!/*/}
        {/*</p> : null}*/}
      </FilterForm>

      {parsedFilter && parsedFilter.type !== "unknown" ? (
        <TrustGraphViewer filter={parsedFilter}/>
      ) : (
        <p>please provide a filter</p>
      )}
    </div>
  );
}

interface TrustGraphViewerProps {
  filter: ValidFilter;
  // onGraphInitialised(): void
  // onSearchComplete(): void

}

//its rather important this doesn't get rerendered cus the opengl context gets reloaded
const TrustGraphViewer = memo(function TrustGraphViewer({filter}: TrustGraphViewerProps) {
  const [web5, setWeb5] = useState<Web5 | null>(null);
  const [myDid, setMyDid] = useState<string | null>(null);

  const [_docs, setDocs] = useState<TrustEstablishmentDoc[] | null>(null);
  //i'm not getting any value out of nodes and edges being seperate atm, cus they're always being updated together
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<TrustGraphEdge[]>([]);

  const [searching, setSearching] = useState<boolean>(true);

  const verifier = useRef<WellKnownDidVerifier>(newVerifier())
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

  useEffect(() => {
    if (!web5 || !myDid) return;
    //filter has changed, initiate new search
    setSearching(true)
    setDocs(null);
    setEdges([]);
    setNodes([]);

    void search(filter, web5, verifier.current, newIndexedGraph(), {
      onUpdateEdges: (newEdges) => {
        setEdges(newEdges);
      },
      onUpdateNodes: (newNodes) => {
        setNodes(newNodes);
      },
      onUpdateDocs: (newDocs) => {
        setDocs((currentDocs) => (currentDocs ?? []).concat(newDocs));
      }
    }).then(() => {
      // onSearchComplete()
      setSearching(false)
    });
  }, [web5, myDid, filter]);

  const [active, setActive] = useState<{ node: InternalGraphNode, props: CollapseProps | undefined } | null>(null);

  const graphRef = useRef<GraphCanvasRef | null>(null);

  const activeNodeData = active?.node.data as { did: string, origin: string | undefined } | undefined
  return (
    <div className="px-20 w-full h-100% flex-1 flex flex-col">
      {searching ? (
        <p className={'px-4 h-4 flex-none inline-flex items-center'}>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {nodes.length === 0 ? "searching..." : null}
        </p>
      ) : null}
      {(!searching && (nodes.length === 0)) ? <p className='px-4'>no trust docs found</p> : null}

      <div className='flex-1 relative'>
        <div className="space-y-2 bg-accent/90" style={{
          zIndex: 9,
          position: 'absolute',
          top: 15,
          right: 15,
          padding: 10,
          width: '240px'
        }}>
          {activeNodeData ? (
            <>
              <p className='text-sm font-semibold'>Origin</p>
              {
                activeNodeData.origin ?
                  <a className='text-xs underline text-blue-600 hover:text-blue-800' href={activeNodeData.origin}>
                    {activeNodeData.origin}
                  </a> : <p className="text-xs font-muted">unknown</p>
              }
              <p className='text-sm font-semibold'>Did</p>
              <p
                className='text-xs break-words overflow-y-scroll max-h-36'>
                {activeNodeData.did}
              </p>
            </>
          ) : <p className='text-sm font-muted font-semibold'>
            No node selected
          </p>
          }
        </div>
        <GraphCanvas
          edges={edges}
          labelType="all"
          layoutType="treeTd2d"
          nodes={nodes}
          onNodeClick={(node, props) => {
            setActive({
              node,
              props
            })
          }
          }

          ref={graphRef}
          renderNode={({
                         node,
                         ...rest
                       }) => <Jdenticon {...rest} node={node} value={node.id}/>
          }

        />
      </div>
    </div>
  );
})

type Filter = ValidFilter | { type: "unknown"; value: string };

function parseFilter(filter: string): Filter {
  if (filter.startsWith("did")) {
    return {type: "did", value: filter};
  }
  return {type: "unknown", value: filter};
}

const UNKNOWN_FILTER_ERR = "expected did";

function FilterForm({
                      className,
                      initialValue,
                      onFilterSubmitted,
                      children
                    }: {
  className?: string;
  initialValue: Filter | undefined;
  onFilterSubmitted: (filter: ValidFilter) => void;
  children?: React.ReactNode
}) {
  const [error, setError] = useState<string | null>(
    initialValue?.type === "unknown" ? UNKNOWN_FILTER_ERR : null,
  );

  return (
    <form
      className={cn("space-y-4 p-4 rounded-md", className)}
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
        placeholder="did"
      />
      <div className=''>
        <Button size="sm" type="submit">
          Submit
        </Button>
        {error ? <label className="ml-3">{error}</label> : null}
        {children}
      </div>
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
      color="ghostwhite"
      image={hmm}
      node={node}
    />
  );
}