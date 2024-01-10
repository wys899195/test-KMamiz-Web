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
import { 
  Card, 
  FormControlLabel, 
  FormGroup, 
  Switch,
  Box, 
  Button,
  Grid, 
  Tooltip,
  TextField,
  Typography,
  FormControl,
  MenuItem,
  Select,
  InputLabel,
} from "@mui/material";
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
// const InformationWindow = lazy(() => import("../components/InformationWindow"));

const useStyles = makeStyles(() => ({
  root: {
    width: "100%",
    overflowX: "clip",
    marginBottom: "5em",
  },
  switch: {
    position: "absolute",
    top: "5em",
    right: "1em",
    paddingLeft: "0.8em",
  },
  canvasContainer:{
    margin:'30x 0px 0px 0px',
    display: 'flex',
    flexWrap: 'wrap',
  },
  canvas:{
    margin:'10px 10px 10px 10px',
    border: '3px solid black',
    float:'left',
  },
  actions: {
    height: "3em",
    display: "flex",
    flexDirection: "row",
    placeItems: "center",
    justifyContent: "center",
    gap: "1em",
    padding: "1em",
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

export default function TaggedDependencyGraph() {
  const classes = useStyles();
  const navigate = useNavigate();
  const graphRef = useRef<any>();
  const rawDataRef = useRef<string>();
  const taggedGraphRef = useRef<any>();
  const taggedRawDataRef = useRef<string>();
  const { search } = useLocation();
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const [size, setSize] = useState([0, 0]);
  const [canvasWidthRate, setCanvasWidthRate] = useState(0.5);
  const [canvasHeightRate, setCanvasHeightRate] = useState(0.7);
  const [data, setData] = useState<any>();
  const [dataBeforeProcess, setDataBeforeProcess] = useState<any>();;
  const [taggedData, setTaggedData] = useState<any>();
  const [highlightInfo, setHighlightInfo] = useHoverHighlight();
  const [displayInfo, setDisplayInfo] = useState<TDisplayNodeInfo | null>(null);
  const [showEndpoint, setShowEndpoint] = useState(true);

  const tag = query.get("tag");
  const [tags, setTags] = useState<string[]>([]);
  const [newVersion, setNewVersion] = useState<string>("");

  
  useEffect(() => {
    const unsubscribe = [
      ViewportUtils.getInstance().subscribe(([vw]) =>
        setCanvasWidthRate(vw > 1250 ? 0.5 : 1)
      ),
      ViewportUtils.getInstance().subscribe(([vw]) =>
        setCanvasHeightRate(vw > 1250 ? 0.7 : 0.45)
      )
    ];
    return () => {
      unsubscribe.forEach((un) => un());
    };
  }, []);

  useLayoutEffect(() => {
    const unsubscribe = [
      ViewportUtils.getInstance().subscribe(([vw, vh]) =>
        setSize([vw, vh])
      ),
    ];
    return () => {
      unsubscribe.forEach((un) => un());
    };
  }, []);

  useEffect(() => {
    GraphService.getInstance().getTagsOfTaggedDependencyGraph().then(setTags);
  }, [query]);

  // useEffect(() => {
  //   const next = (nextData?: TGraphData) => {
  //     const nextRawData = JSON.stringify(nextData);
  //     if (rawDataRef.current === nextRawData) return;
  //     if (!rawDataRef.current) {
  //       const timer = setInterval(() => {
  //         if (!graphRef.current) return;
  //         clearInterval(timer);
  //         setTimeout(() => {
  //           graphRef.current.zoom(4, 0);
  //         }, 10);
  //       });
  //     }
  //     rawDataRef.current = nextRawData;
  //     setData(nextData && DependencyGraphUtils.ProcessData(nextData));
  //   };

  //   const unSub = showEndpoint
  //     ? GraphService.getInstance().subscribeToEndpointDependencyGraph(next)
  //     : GraphService.getInstance().subscribeToServiceDependencyGraph(next);
  //   return () => {
  //     unSub();
  //   };
  // }, [showEndpoint]);

  useEffect(() => {
    GraphService.getInstance().getDependencyGraph(showEndpoint).then((nextData) => {
      if (nextData){
        setData(DependencyGraphUtils.ProcessData(nextData));
      }
    });
    GraphService.getInstance().getDependencyGraph(true).then((nextData) => {
      if (nextData){
        setDataBeforeProcess(nextData);
      }
    });
    GraphService.getInstance().getTaggedDependencyGraph(showEndpoint,tag).then((nextTaggedData) => {
      if (nextTaggedData){
        setTaggedData(DependencyGraphUtils.ProcessData(nextTaggedData));
      }
    });

    // const next = (nextTaggedData?: TGraphData) => {
    //   const nextTaggedRawData = JSON.stringify(nextTaggedData);
    //   if (taggedRawDataRef.current === nextTaggedRawData) return;
    //   if (!taggedRawDataRef.current) {
    //     const timer = setInterval(() => {
    //       if (!taggedGraphRef.current) return;
    //       clearInterval(timer);
    //       setTimeout(() => {
    //         taggedGraphRef.current.zoom(4, 0);
    //       }, 10);
    //     });
    //   }
    //   taggedRawDataRef.current = nextTaggedRawData;
    //   // console.log("nextTaggedData = ")
    //   // console.log(nextTaggedData)
    //   // console.log("tagyy = "+ tag)
    //   setTaggedData(nextTaggedData && DependencyGraphUtils.ProcessData(nextTaggedData));
    // };

    // const unSub = showEndpoint
    //   ? GraphService.getInstance().subscribeToTaggedEndpointDependencyGraph(next,tag)
    //   : GraphService.getInstance().subscribeToTaggedServiceDependencyGraph(next,tag);
    // return () => {
    //   unSub();
    // };
  }, [showEndpoint,tag]);

  const createNewVersion = async () => {
    if (!dataBeforeProcess || !newVersion) return;
    await GraphService.getInstance().addTaggedDependencyGraphData({
      tag: newVersion,
      graphData:dataBeforeProcess,
    });
    setNewVersion("");
    navigate(`/taggedDependencyGraph?tag=${newVersion}`);
  };

  const deleteVersion = async () => {
    if (!tag || tag === "Latest") return;
    await GraphService.getInstance().deleteTaggedDependencyGraph(tag);
    navigate(`/taggedDependencyGraph`);
  };

  

  return (
    <div className={classes.root}>
      <div className={classes.canvasContainer}> 
        <div className={classes.canvas}>
          <Grid container padding={1} spacing={1}>
            <Grid item xs={6}>
              <Typography variant="h5">Latest Version</Typography>
            </Grid>
            <Grid item xs={6}>
              <Card variant="outlined" className={classes.actions}>
                <TextField
                  fullWidth
                  label="Save as Historical Version"
                  variant="outlined"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                />
                <Tooltip title="Create a new version">
                  <Button variant="contained" onClick={() => createNewVersion()}>
                    Create
                  </Button>
                </Tooltip>
              </Card>
            </Grid>
          </Grid>
          <Suspense fallback={<Loading />}>
            <ForceGraph2D
              ref={graphRef}
              width={size[0] * canvasWidthRate - 50}
              height={size[1] * canvasHeightRate - 50}
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
        <div className={classes.canvas}>
          <Grid container padding={1} spacing={1}>
            <Grid item xs={4}>
              <Typography variant="h5">Historical Versions</Typography>
            </Grid>
            <Grid item xs={8}>
              <Card variant="outlined" className={classes.actions}>
                <FormControl fullWidth>
                  <InputLabel id="tag-label">Selected Version</InputLabel>
                  <Select
                    labelId="tag-label"
                    value={tag || "latest"}
                    label="Selected Version"
                    onChange={(e) => {
                      const tag =
                        e.target.value !== "latest"
                          ? `?tag=${encodeURIComponent(e.target.value)}`
                          : "";
                      navigate(`/taggedDependencyGraph${tag}`);
                      console.log(tag)

                      //  console.log("e.target.value")
                      //  console.log(e.target.value)
                      //  console.log(tag)
                      //   // console.log("GraphService.getInstance().getTaggedServiceDependencyGraph")
                      //   // console.log(GraphService.getInstance().getTaggedServiceDependencyGraph(tag))
                      //   // setTaggedData(GraphService.getInstance().getTaggedServiceDependencyGraph(tag))
                    }}
                  >
                    <MenuItem value="latest">Latest</MenuItem>
                    {tags.map((t, i) => (
                      <MenuItem key={`tag-${i}`} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Tooltip title="Delete selected">
                  <>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => deleteVersion()}
                      disabled={!tag || tag === "Latest"}
                    >
                      Delete
                    </Button>
                  </>
                </Tooltip>
              </Card>
            </Grid>
          </Grid>
          <Suspense fallback={<Loading />}>
            <ForceGraph2D
              ref={taggedGraphRef}
              width={size[0] * canvasWidthRate - 50}
              height={size[1] * canvasHeightRate - 50}
              graphData={taggedData}
              {...DependencyGraphFactory.Create(
                highlightInfo,
                setHighlightInfo,
                taggedGraphRef,
                setDisplayInfo
              )}
            />
          </Suspense>
        </div>
      </div>

      {/* <Suspense fallback={<Loading />}>
        {displayInfo && <InformationWindow info={displayInfo} />}
      </Suspense> */}
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
