import { makeStyles } from "@mui/styles";
import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Card, FormControlLabel, FormGroup, Switch } from "@mui/material";
import { DependencyGraphFactory } from "../classes/DependencyGraphFactory";
import {
  useHoverHighlight,
  DependencyGraphUtils,
} from "../classes/DependencyGraphUtils";
import ViewportUtils from "../classes/ViewportUtils";
import GraphService from "../services/GraphService";
import { TGraphData } from "../entities/TGraphData";
import { TDisplayNodeInfo } from "../entities/TDisplayNodeInfo";
import Loading from "../components/Loading";
import { useLocation, useNavigate } from "react-router-dom";

const ForceGraph2D = lazy(() => import("react-force-graph-2d"));
const InformationWindow = lazy(() => import("../components/InformationWindow"));

const useStyles = makeStyles(() => ({
  root: {
    width: "100%",
    height: "calc(100vh - 64px)",
    overflow: "hidden",
  },
  switch: {
    position: "absolute",
    top: "5em",
    right: "1em",
    paddingLeft: "0.8em",
  },
}));

function queryToDisplayInfo(query: string): TDisplayNodeInfo {
  const raw = atob(decodeURIComponent(query));
  const [service, namespace, version, method, label] = raw.split("\t");
  const type = version && method && label ? "EP" : "SRV";
  const name =
    type === "SRV"
      ? `${service}.${namespace}`
      : `(${version}) ${method.toUpperCase()} ${label}`;

  return {
    labelName: label,
    type,
    service,
    namespace,
    version,
    name,
    method,
    uniqueServiceName: `${service}\t${namespace}\t${version}`,
  };
}

function displayInfoToQuery(info: TDisplayNodeInfo) {
  let query = "";

  if (info.type === "SRV") {
    query = `${info.service!}\t${info.namespace!}`;
  } else if (info.type === "EP") {
    query = `${info.uniqueServiceName!}\t${info.method!}\t${info.labelName}`;
  }

  return encodeURIComponent(btoa(query));
}

export default function DependencyGraph() {
  const classes = useStyles();
  const navigate = useNavigate();
  const graphRef = useRef<any>();
  const rawDataRef = useRef<string>();
  const { search } = useLocation();
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const [size, setSize] = useState([0, 0]);
  const [data, setData] = useState<any>();
  const [highlightInfo, setHighlightInfo] = useHoverHighlight();
  const [displayInfo, setDisplayInfo] = useState<TDisplayNodeInfo | null>(null);
  const [showEndpoint, setShowEndpoint] = useState(true);

  useLayoutEffect(() => {
    const unsubscribe = ViewportUtils.getInstance().subscribe(([vw, vh]) =>
      setSize([vw, vh])
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!data) return;
    const selected = query.get("s");
    if (selected) {
      const info = queryToDisplayInfo(selected);
      const node = data?.nodes.find((n: any) => n.name === info.name);
      if (node) {
        DependencyGraphFactory.OnClick(node, graphRef, setDisplayInfo);
        setHighlightInfo(
          DependencyGraphFactory.HighlightOnNodeHover(node, highlightInfo)
        );
      }
    }
  }, [data, search]);

  useEffect(() => {
    if (!data) return;
    navigate(`/${displayInfo ? `?s=${displayInfoToQuery(displayInfo)}` : ""}`, {
      replace: true,
    });
  }, [displayInfo]);

  useEffect(() => {
    const next = (nextData?: TGraphData) => {
      const nextRawData = JSON.stringify(nextData);
      if (rawDataRef.current === nextRawData) return;
      if (!rawDataRef.current) {
        const timer = setInterval(() => {
          if (!graphRef.current) return;
          clearInterval(timer);
          setTimeout(() => {
            graphRef.current.zoom(4, 0);
          }, 10);
        });
      }
      rawDataRef.current = nextRawData;
      setData(nextData && DependencyGraphUtils.ProcessData(nextData));
    };

    const unSub = showEndpoint
      ? GraphService.getInstance().subscribeToEndpointDependencyGraph(next)
      : GraphService.getInstance().subscribeToServiceDependencyGraph(next);
    return () => {
      unSub();
    };
  }, [showEndpoint]);

  return (
    <div className={classes.root}>
      <div>
        <Suspense fallback={<Loading />}>
          <ForceGraph2D
            ref={graphRef}
            width={size[0]}
            height={size[1]}
            graphData={data}
            {...DependencyGraphFactory.Create(
              highlightInfo,
              setHighlightInfo,
              graphRef,
              setDisplayInfo
            )}
          />
        </Suspense>
      </div>
      <Suspense fallback={<Loading />}>
        {displayInfo && <InformationWindow info={displayInfo} />}
      </Suspense>
      <Card className={classes.switch}>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={showEndpoint}
                onChange={(e) => setShowEndpoint(e.target.checked)}
              />
            }
            label="Show endpoints"
          />
        </FormGroup>
      </Card>
    </div>
  );
}
