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
  Box,
  Card, 
  FormControlLabel, 
  FormGroup, 
  Switch,
  Button,
  Grid, 
  Tooltip,
  TextField,
  Typography,
  FormControl,
  MenuItem,
  Select,
  InputLabel,
  Divider,
} from "@mui/material";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnglesUp } from '@fortawesome/free-solid-svg-icons';
import { Element, scroller } from 'react-scroll';
import { 
  DiffDependencyGraphFactory
} from "../classes/DiffDependencyGraphFactory";
import { 
  DiffDetailDependencyGraphFactory
} from "../classes/DiffDetailDependencyGraphFactory";
import {
  useGraphDifference,
  DependencyGraphUtils,
  ServicvePairRelasionShip,
} from "../classes/DependencyGraphUtils";
import ViewportUtils from "../classes/ViewportUtils";
import GraphService from "../services/GraphService";
import Loading from "../components/Loading";
import { TGraphData } from "../entities/TGraphData";
import { useLocation, useNavigate } from "react-router-dom";


// import GraphDiffTabs from '../components/GraphDiffTabs';
const ForceGraph2D = lazy(() => import("react-force-graph-2d"));

const useStyles = makeStyles(() => ({
  root: {
    width: "100%",
    overflowX: "clip",
    marginBottom: "5em",
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
  graphContainer: {
    border: '0.08em solid #ccc',
    boxShadow: '0.4em 0em 0.5em rgba(0, 0, 0, 0.1)',
    float:'left',
  },
  graphTitle: {
    fontWeight:'normal',
  },
  graphHeader: {
    borderBottom: '0.08em solid #ccc',
    boxShadow: '0.0em  0.4em 0.5em rgba(0, 0, 0, 0.1)',
    paddingLeft:'0.5em',
  },
  pageHeader: {
    borderBottom: '0.2em solid #ccc',
    boxShadow: '0.0em  0.4em 0.5em rgba(0, 0, 0, 0.1)',
    position: "fixed",
    top: "4em",
    left: "0em",
    backgroundColor:'white',
    zIndex:99,
  },
  pageBody: {
    marginTop:'8.5em',
  },
  switchEndpoint: {
    position: "fixed",
    top: "4.5em",
    right: "1em",
    paddingLeft: "0.8em",
    zIndex:100,
  },
  graphMessage: {
    textAlign: 'center',
    color:'gray',
    marginTop:'0.08em',
    width:'100%',
    height:'0.01em',
  }
}));

export default function DependencyGraphDiff() {
  const classes = useStyles();
  const navigate = useNavigate();
  const { search } = useLocation();
  
  // component references
  const graphRef = useRef<any>();
  const rawDataRef = useRef<string>();
  const taggedGraphRef = useRef<any>();
  const taggedRawDataRef = useRef<string>();

  const servicePairGraphRef = useRef<any>();
  const rawServicePairDataRef = useRef<string>();
  const taggedServicePairGraphRef = useRef<any>();
  const rawTaggedServicePairDataRef = useRef<string>();

  // graph data
  const [data, setData] = useState<any>();
  const [taggedData, setTaggedData] = useState<any>();
  const [servicePairData, setServicePairData] = useState<any>();
  const [taggedServicePairData, setTaggedServicePairData] = useState<any>();
  const [rawData, setRawData] = useState<TGraphData | null>(null);
  const [taggedRawData, setTaggedRawData] = useState<TGraphData | null>(null);
  const [graphDifferenceInfo, setGraphDifferenceInfo] = useGraphDifference();

  // graph display 
  const [showEndpoint, setShowEndpoint] = useState(true);
  const [showServicePairDiff, setShowServicePairDiff] = useState(false);

  // size control
  const rwdWidth = 1300
  const [pageSize, setPageSize] = useState([0, 0]);
  const [gridSize, setGridSize] = useState(12);
  const [graphWidthRate, setCanvasWidthRate] = useState(0.5);
  const [graphHeightRate, setCanvasHeightRate] = useState(0.65);

  // to get a specific version graph data
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const tag = query.get("tag");
  const [tags, setTags] = useState<string[]>([]);
  const [newVersion, setNewVersion] = useState<string>("");

  // some controller at "Diff Details ( between each pair of services" area
  const [allSvcNodeIds, setAllSvcNodeIds] = useState<string[]>([]);
  const [firstSvcNodeId, setFirstSvcNodeId] = useState<string>("");
  const [secondSvcNodeId, setSecondSvcNodeId] = useState<string>("");
  const [servicePairGraphRS,setServicePairGraphRS] = useState<ServicvePairRelasionShip>('no matching services in graph');
  const [taggedServicePairGraphRS,setTaggedServicePairGraphRS] = useState<ServicvePairRelasionShip>('no matching services in graph');
  const [servicePairGraphMessage, setServicePairGraphMessage] = useState<string>("");
  const [taggedServicePairGraphMessage, setTaggedServicePairGraphMessage] = useState<string>("");

  useEffect(() => {
    const unsubscribe = [
      ViewportUtils.getInstance().subscribe(([vw]) =>{
        setGridSize(vw > rwdWidth ? 6 : 12)
        setCanvasWidthRate(vw > rwdWidth ? 0.5 : 0.99);
        setCanvasHeightRate(vw > rwdWidth ? 0.65 : 0.65);
      }),
    ];
    return () => {
      unsubscribe.forEach((un) => un());
    };
  }, []);

  useLayoutEffect(() => {
    const unsubscribe = [
      ViewportUtils.getInstance().subscribe(([vw, vh]) =>
        setPageSize([vw, vh])
      ),
    ];
    return () => {
      unsubscribe.forEach((un) => un());
    };
  }, []);

  useEffect(() => {
    GraphService.getInstance().getTagsOfTaggedDependencyGraph().then(setTags);
    setFirstSvcNodeId("");
    setSecondSvcNodeId("");
    setTimeout(() => {
      scrollToElement('Overview Title');
    }, 100);
  }, [query]);

  useEffect(() => {
    GraphService.getInstance().getDependencyGraph(true).then((nextBeforeProcessData) => {
      if (nextBeforeProcessData){
        setRawData(nextBeforeProcessData);
      }
    });
    GraphService.getInstance().getTaggedDependencyGraph(true,tag).then((nextTaggedRawData) => {
      if (nextTaggedRawData){
        setTaggedRawData(nextTaggedRawData);
      }
    });
    GraphService.getInstance().getDependencyGraph(showEndpoint).then((nextData) => {
      if (nextData){
        const nextRawData = JSON.stringify(nextData);
        if (rawDataRef.current === nextRawData) return;
        if (!rawDataRef.current) {
          const timer = setInterval(() => {
            if (!graphRef.current) return;
            clearInterval(timer);
            setTimeout(() => {
              graphRef.current.zoom(3, 0);
              graphRef.current.centerAt(0, 0);
            }, 10);
          });
        }
        rawDataRef.current = nextRawData;
        setData(DependencyGraphUtils.ProcessData(nextData));
      }
    });
    GraphService.getInstance().getTaggedDependencyGraph(showEndpoint,tag).then((nextTaggedData) => {
      if (nextTaggedData){
        const nextTaggedRawData = JSON.stringify(nextTaggedData);
        if (taggedRawDataRef.current === nextTaggedRawData) return;
        if (!taggedRawDataRef.current) {
          const timer = setInterval(() => {
            if (!taggedGraphRef.current) return;
            clearInterval(timer);
            setTimeout(() => {
              taggedGraphRef.current.zoom(3, 0);
              taggedGraphRef.current.centerAt(0, 0);
            }, 10);
          });
        }
        taggedRawDataRef.current = nextTaggedRawData;
        ;
        setTaggedData(DependencyGraphUtils.ProcessData(nextTaggedData));
      }
    });
  }, [showEndpoint,tag]);

  useEffect(() => {
    if(firstSvcNodeId && secondSvcNodeId){
      GraphService.getInstance().getDependencyGraph(showEndpoint).then((nextTwoServicesData) => {
        if (nextTwoServicesData){
          const {graph,relationship} = DependencyGraphUtils
            .toDetailsBetweenTwoServicesGraph(nextTwoServicesData,firstSvcNodeId,secondSvcNodeId)
          const nextTwoServicesRawData = JSON.stringify(graph);
          if (rawServicePairDataRef.current === nextTwoServicesRawData) return;
          if (!rawServicePairDataRef.current) {
            const timer = setInterval(() => {
              if (!servicePairGraphRef.current) return;
              clearInterval(timer);
              setTimeout(() => {
                servicePairGraphRef.current.zoom(3, 0);
                servicePairGraphRef.current.centerAt(0, 0);
              }, 10);
            });
          }
          rawServicePairDataRef.current = nextTwoServicesRawData;
          setServicePairData(DependencyGraphUtils.ProcessData(graph));
          setServicePairGraphRS(relationship);
          setMessageByRelationship(relationship,setServicePairGraphMessage)
        }
      });
      GraphService.getInstance().getTaggedDependencyGraph(showEndpoint,tag).then((nextTwoServicesTaggedData) => {
        if (nextTwoServicesTaggedData){
          const {graph,relationship} = DependencyGraphUtils
            .toDetailsBetweenTwoServicesGraph(nextTwoServicesTaggedData,firstSvcNodeId,secondSvcNodeId);
          const nextTwoServicesTaggedRawData = JSON.stringify(graph);
          if (rawTaggedServicePairDataRef.current === nextTwoServicesTaggedRawData) return;
          if (!rawTaggedServicePairDataRef.current) {
            const timer = setInterval(() => {
              if (!taggedServicePairGraphRef.current) return;
              clearInterval(timer);
              setTimeout(() => {
                taggedServicePairGraphRef.current.zoom(3, 0);
                taggedServicePairGraphRef.current.centerAt(0, 0);
              }, 10);
            });
          }
          rawTaggedServicePairDataRef.current = nextTwoServicesTaggedRawData;
          setTaggedServicePairData(DependencyGraphUtils.ProcessData(graph));
          setTaggedServicePairGraphRS(relationship);
          setMessageByRelationship(relationship,setTaggedServicePairGraphMessage)
        }
      });
      setShowServicePairDiff(true);
      scrollToElement('Service Pair Details Title');
    }
    else{
      setShowServicePairDiff(false);
    }
  }, [showEndpoint,tag,firstSvcNodeId,secondSvcNodeId]);

  useEffect(() => {
    if(rawData && taggedRawData){
      const nextGraphDifferenceInfo = DependencyGraphUtils.CompareTwoGraphData(rawData,taggedRawData) ;
      setGraphDifferenceInfo(nextGraphDifferenceInfo);
      setAllSvcNodeIds(nextGraphDifferenceInfo.allServiceNodeIds);
    }
  }, [rawData,taggedRawData]);

  const createNewVersion = async () => {
    if (!rawData || !newVersion) return;
    await GraphService.getInstance().addTaggedDependencyGraphData({
      tag: newVersion,
      graphData:rawData,
    });
    setNewVersion("");
    navigate(`/dependencyGraphDiff?tag=${newVersion}`);
  };

  const deleteVersion = async () => {
    if (!tag || tag === "Latest") return;
    await GraphService.getInstance().deleteTaggedDependencyGraph(tag);
    navigate(`/dependencyGraphDiff`);
  };

  const scrollToElement = (elementName:string) => {
    scroller.scrollTo(elementName, {
      duration: 300,
      smooth: true,
      offset: -216,
    });
  };

  const setMessageByRelationship = (relationship: ServicvePairRelasionShip, setMessage: (message: string) => void) => {
    switch (relationship) {
      case 'no matching services in graph':
        setMessage('These two given services do not exist in this version.');
        break;
      case 'indirect dependency':
        setMessage('These two given services do not have a direct dependency in this version.');
        break;
      default:
        setMessage('');
        break;
    }
  }


  return (
    <Box className={classes.root}>
      <Grid container padding={1} spacing={0.5} className={classes.pageHeader}>
        <Grid item xs={12} style={{marginBottom:'0.5em'}}>
          <Typography variant="h5">Dependency Graph Diff</Typography>
        </Grid>
        <Grid item xs={6}>
          <Card variant="outlined" className={classes.actions}>
            <TextField
              fullWidth
              label="save the latest version as a new version"
              variant="outlined"
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
            />
            <Tooltip title="Save the latest version as a new version">
              <Button variant="contained" onClick={() => createNewVersion()}>
                Create
              </Button>
            </Tooltip>
          </Card>
        </Grid>
        <Grid item xs={6}>
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
                  navigate(`/dependencyGraphDiff${tag}`);
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
      <Grid container padding={1} spacing={1} className={classes.pageBody}>
        <Grid item xs={12} >
          <Element name="Overview Title">
            <Typography variant="h6">Diff Overview</Typography>
          </Element>
        </Grid>
        <Grid item xs={gridSize}>
          <div className={classes.graphContainer}>
            <Grid item xs={12} className={classes.graphHeader}>
              <h3 className={classes.graphTitle}>Latest Version</h3>
            </Grid>
            <Suspense fallback={<Loading />}>
              <ForceGraph2D
                ref={graphRef}
                width={pageSize[0] * graphWidthRate - 20}
                height={pageSize[1] * graphHeightRate - 40}
                graphData={data}
                {...DiffDependencyGraphFactory.Create(
                  graphDifferenceInfo
                )}
              />
            </Suspense>
          </div>
        </Grid>
        <Grid item xs={gridSize}>
          <div className={classes.graphContainer}>
            <Grid item xs={12} className={classes.graphHeader}>
              <h3 className={classes.graphTitle}>Selected Version</h3>
            </Grid>
            <Suspense fallback={<Loading />}>
              <ForceGraph2D
                ref={taggedGraphRef}
                width={pageSize[0] * graphWidthRate - 20}
                height={pageSize[1] * graphHeightRate - 40}
                graphData={taggedData}
                {...DiffDependencyGraphFactory.Create(
                  graphDifferenceInfo
                )}
              />
            </Suspense>
          </div>
        </Grid>
        <Grid item xs={12}>
          <Element name="Service Pair Details Title">
            <Typography variant="h6">Diff Details ( between each pair of services )</Typography>
          </Element>
        </Grid>
        <Grid item xs={5}>
          <FormControl fullWidth>
            <InputLabel id="fsvc-nid-label">First Service</InputLabel>
            <Select
              labelId="fsvc-nid-label"
              value={firstSvcNodeId}
              label="Selected First Service"
              onChange={(e) => {
                setFirstSvcNodeId(e.target.value)
              }}
            >
              {
                allSvcNodeIds.length >= 2
                ? allSvcNodeIds.filter(id => id != secondSvcNodeId).map((id, i) => (
                  <MenuItem key={`fsvc-nid-${i}`} value={id}>
                    {id.replace("\t", ".")}
                  </MenuItem>))
                : <MenuItem disabled key={`fsvc-not-enough-id`} value={''}>
                    Cannot select, as there are fewer than 2 services in the system.
                  </MenuItem>
              }
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={5}>
        <FormControl fullWidth>
            <InputLabel id="ssvc-nid-label">Second Service</InputLabel>
            <Select
              labelId="ssvc-nid-label"
              value={secondSvcNodeId}
              label="Selected Second Service"
              onChange={(e) => {
                setSecondSvcNodeId(e.target.value)
              }}
            >
              {
                allSvcNodeIds.length >= 2
                ? allSvcNodeIds.filter(id => id != firstSvcNodeId).map((id, i) => (
                    <MenuItem key={`ssvc-nid-${i}`} value={id}>
                      {id.replace("\t", ".")}
                    </MenuItem>
                  ))
                : <MenuItem disabled key={`ssvc-not-enough-id`} value={''}>
                    The number of services in the system is less than 2.
                  </MenuItem>
              }
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={gridSize} style={showServicePairDiff ? {} : {display:'none'}}>
          <div className={classes.graphContainer}>
            <Grid item xs={12} className={classes.graphHeader}>
              <h3 className={classes.graphTitle}>Latest Version</h3>
            </Grid>
            <h3 className={classes.graphMessage}>{servicePairGraphMessage}</h3>
            <Suspense fallback={<Loading />}>
              <ForceGraph2D
                ref={servicePairGraphRef}
                width={pageSize[0] * graphWidthRate - 20}
                height={pageSize[1] * graphHeightRate - 115}
                graphData={servicePairData}
                {...DiffDetailDependencyGraphFactory.Create(
                  graphDifferenceInfo,
                  firstSvcNodeId,
                  secondSvcNodeId,
                  servicePairGraphRS
                )}
              />
            </Suspense>
          </div>
        </Grid>
        <Grid item xs={gridSize} style={showServicePairDiff ? {} : {display:'none'}}>
          <div className={classes.graphContainer}>
            <Grid item xs={12} className={classes.graphHeader}>
              <h3 className={classes.graphTitle}>Selected Version</h3>
            </Grid>
            <h3 className={classes.graphMessage}>{taggedServicePairGraphMessage}</h3>
            <Suspense fallback={<Loading />}>
              <ForceGraph2D
                ref={taggedServicePairGraphRef}
                width={pageSize[0] * graphWidthRate - 20}
                height={pageSize[1] * graphHeightRate - 115}
                graphData={taggedServicePairData}
                {...DiffDetailDependencyGraphFactory.Create(
                  graphDifferenceInfo,
                  firstSvcNodeId,
                  secondSvcNodeId,
                  taggedServicePairGraphRS
                )}
              />
            </Suspense>

          </div>
        </Grid>
      </Grid>

      <Card className={classes.switchEndpoint}>
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
    </Box>
  );
}
