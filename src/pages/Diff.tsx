import { makeStyles } from "@mui/styles";
import {
  lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState,
} from "react";
import { 
  Box, Card, FormControlLabel, FormGroup, Switch, Button, Grid, Tooltip, TextField, Typography, FormControl, 
  MenuItem, Select, InputLabel,Divider,
} from "@mui/material";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnglesUp } from '@fortawesome/free-solid-svg-icons';
import ReactApexChart from "react-apexcharts";
import BarChartUtils from "../classes/BarChartUtils";
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
import { TTotalServiceInterfaceCohesion } from "../entities/TTotalServiceInterfaceCohesion";
import { TServiceCoupling } from "../entities/TServiceCoupling";
import { TServiceInstability } from "../entities/TServiceInstability";
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
    marginTop:'14em',
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

export default function Diff() {
  const classes = useStyles();
  const navigate = useNavigate();
  const { search } = useLocation();
  
  /***component references***/
  //version 1
  const graphV1Ref = useRef<any>();
  const rawDataV1Ref = useRef<string>();
  const servicePairGraphV1Ref = useRef<any>();
  const rawServicePairDataV1Ref = useRef<string>();

  // version2
  const graphV2Ref = useRef<any>();
  const rawDataV2Ref = useRef<string>();
  const servicePairGraphV2Ref = useRef<any>();
  const rawServicePairDataV2Ref = useRef<string>();

  /***data & raw data***/
  //latest version (to create new verion)
  const [latestRawData, setLatestRawData] = useState<TGraphData | null>(null);
  const [latestCohesion, setLatestCohesion] = useState<TTotalServiceInterfaceCohesion[]>([]);
  const [latestCoupling, setLatestCoupling] = useState<TServiceCoupling[]>([]);
  const [latestInstability, setLatestInstability] = useState<TServiceInstability[]>([]);

  //version1
  const [dataV1, setDataV1] = useState<any>();
  const [servicePairDataV1, setServicePairDataV1] = useState<any>();
  const [rawDataV1, setRawDataV1] = useState<TGraphData | null>(null);
  const [cohesionV1, setCohesionV1] = useState<TTotalServiceInterfaceCohesion[]>([]);
  const [couplingV1, setCouplingV1] = useState<TServiceCoupling[]>([]);
  const [instabilityV1, setInstabilityV1] = useState<TServiceInstability[]>([]);

  //version2
  const [DataV2, setDataV2] = useState<any>();
  const [servicePairDataV2, setServicePairDataV2] = useState<any>();
  const [rawDataV2, setRawDataV2] = useState<TGraphData | null>(null);
  const [cohesionV2, setCohesionV2] = useState<TTotalServiceInterfaceCohesion[]>([]);
  const [couplingV2, setCouplingV2] = useState<TServiceCoupling[]>([]);
  const [instabilityV2, setInstabilityV2] = useState<TServiceInstability[]>([]);

  /***graph diff info***/
  const [graphDifferenceInfo, setGraphDifferenceInfo] = useGraphDifference();

  /***for graph display***/
  const [showEndpoint, setShowEndpoint] = useState(true);
  const [showServicePairDiff, setShowServicePairDiff] = useState(false);

  /***window size control***/
  const rwdWidth = 1300
  const [pageSize, setPageSize] = useState([0, 0]);
  const [gridSize, setGridSize] = useState(12);
  const [graphWidthRate, setCanvasWidthRate] = useState(0.5);
  const [graphHeightRate, setCanvasHeightRate] = useState(0.65);

  /***to get a specific version diff data***/
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const tagV1 = query.get("tagV1"); //version1 tag
  const tagV2 = query.get("tagV2"); //version2 tag
  const [tags, setTags] = useState<string[]>([]);
  const [newVersion, setNewVersion] = useState<string>("");


  /***some controller at "Diff Details ( between each pair of services" area***/
  const [allSvcNodeIds, setAllSvcNodeIds] = useState<string[]>([]);
  const [firstSvcNodeId, setFirstSvcNodeId] = useState<string>("");
  const [secondSvcNodeId, setSecondSvcNodeId] = useState<string>("");
  const [servicePairGraphV1RS,setServicePairGraphV1RS] = useState<ServicvePairRelasionShip>('no matching services in graph');
  const [servicePairGraphV2RS,setServicePairGraphV2RS] = useState<ServicvePairRelasionShip>('no matching services in graph');
  const [servicePairGraphV1Message, setServicePairGraphV1Message] = useState<string>("");
  const [servicePairGraphV2Message, setServicePairGraphV2Message] = useState<string>("");

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
    GraphService.getInstance().getTagsOfDiffdata().then(setTags);
    setFirstSvcNodeId("");
    setSecondSvcNodeId("");
    setTimeout(() => {
      // scrollToElement('Overview Title');
    }, 100);
  }, [query]);


  /***useEffect for graph diff***/
  //latest version
  useEffect(() => {
    GraphService.getInstance().getDependencyGraph(true).then((nextLatestRawData) => {
      if (nextLatestRawData){
        setLatestRawData(nextLatestRawData);
      }
    });
  }, [showEndpoint,tagV1,tagV2]);
  //version1
  useEffect(() => {
    GraphService.getInstance().getTaggedDependencyGraph(true,tagV1).then((nextRawDataV1) => {
      if (nextRawDataV1){
        setRawDataV1(nextRawDataV1);
      }
    });
    GraphService.getInstance().getTaggedDependencyGraph(showEndpoint,tagV1).then((nextDataV1) => {
      if (nextDataV1){
        const nextRawData = JSON.stringify(nextDataV1);
        if (rawDataV1Ref.current === nextRawData) return;
        if (!rawDataV1Ref.current) {
          const timer = setInterval(() => {
            if (!graphV1Ref.current) return;
            clearInterval(timer);
            setTimeout(() => {
              graphV1Ref.current.zoom(3, 0);
              graphV1Ref.current.centerAt(0, 0);
            }, 10);
          });
        }
        rawDataV1Ref.current = nextRawData;
        setDataV1(DependencyGraphUtils.ProcessData(nextDataV1));
      }
    });
  }, [showEndpoint,tagV1]);
  //version2
  useEffect(() => {
    GraphService.getInstance().getTaggedDependencyGraph(true,tagV2).then((nextRawDataV2) => {
      if (nextRawDataV2){
        setRawDataV2(nextRawDataV2);
      }
    });
    GraphService.getInstance().getTaggedDependencyGraph(showEndpoint,tagV2).then((nextDataV2) => {
      if (nextDataV2){
        const nextRawDataV2 = JSON.stringify(nextDataV2);
        if (rawDataV2Ref.current === nextRawDataV2) return;
        if (!rawDataV2Ref.current) {
          const timer = setInterval(() => {
            if (!graphV2Ref.current) return;
            clearInterval(timer);
            setTimeout(() => {
              graphV2Ref.current.zoom(3, 0);
              graphV2Ref.current.centerAt(0, 0);
            }, 10);
          });
        }
        rawDataV2Ref.current = nextRawDataV2;
        ;
        setDataV2(DependencyGraphUtils.ProcessData(nextDataV2));
      }
    });
  }, [showEndpoint,tagV2]);

  
  /***useEffect for insight diff***/
  //latest version
  useEffect(() => {
    //Cohesion
    GraphService.getInstance().getServiceCohesion().then((nextLatestCohesionData) => {
      if (nextLatestCohesionData){
        setLatestCohesion(nextLatestCohesionData);
      }
    });
    //Coupling
    GraphService.getInstance().getTaggedServiceCoupling(tagV1).then((nextLatestCouplingData) => {
      if (nextLatestCouplingData){
        setLatestCoupling(nextLatestCouplingData);
      }
    }); 
    //Instability
    GraphService.getInstance().getTaggedServiceInstability(tagV1).then((nextLatestInstabilityData) => {
      if (nextLatestInstabilityData){
        setLatestInstability(nextLatestInstabilityData);
      }
    }); 
  }, [tagV1,tagV2]);

  //version1
  useEffect(() => {
    //Cohesion
    GraphService.getInstance().getTaggedServiceCohesion(tagV1).then((nextCohesionDataV1) => {
      if (nextCohesionDataV1){
        setCohesionV1(nextCohesionDataV1);
      }
    });
    //Coupling
    GraphService.getInstance().getTaggedServiceCoupling(tagV1).then((nextCouplingDataV1) => {
      if (nextCouplingDataV1){
        setCouplingV1(nextCouplingDataV1);
      }
    }); 
    //Instability
    GraphService.getInstance().getTaggedServiceInstability(tagV1).then((nextInstabilityDataV1) => {
      if (nextInstabilityDataV1){
        setInstabilityV1(nextInstabilityDataV1);
      }
    }); 

  }, [tagV1]);

  //version2
  useEffect(() => {
    //Cohesion
    GraphService.getInstance().getTaggedServiceCohesion(tagV2).then((nextCohesionDataV2) => {
      if (nextCohesionDataV2){
        setCohesionV2(nextCohesionDataV2);
      }
    }); 
    //Coupling
    GraphService.getInstance().getTaggedServiceCoupling(tagV2).then((nextCouplingDataV2) => {
      if (nextCouplingDataV2){
        setCouplingV2(nextCouplingDataV2);
      }
    });
    //Instability
    GraphService.getInstance().getTaggedServiceInstability(tagV2).then((nextInstabilityDataV2) => {
      if (nextInstabilityDataV2){
        setInstabilityV2(nextInstabilityDataV2);
      }
    }); 

  }, [tagV2]);

  useEffect(() => {
    if(firstSvcNodeId && secondSvcNodeId){
      GraphService.getInstance().getTaggedDependencyGraph(showEndpoint,tagV1).then((nextTwoServicesDataV1) => {
        if (nextTwoServicesDataV1){
          const {graph,relationship} = DependencyGraphUtils
            .toDetailsBetweenTwoServicesGraph(nextTwoServicesDataV1,firstSvcNodeId,secondSvcNodeId)
          const nextTwoServicesRawDataV1 = JSON.stringify(graph);
          if (rawServicePairDataV1Ref.current === nextTwoServicesRawDataV1) return;
          if (!rawServicePairDataV1Ref.current) {
            const timer = setInterval(() => {
              if (!servicePairGraphV1Ref.current) return;
              clearInterval(timer);
              setTimeout(() => {
                servicePairGraphV1Ref.current.zoom(3, 0);
                servicePairGraphV1Ref.current.centerAt(0, 0);
              }, 10);
            });
          }
          rawServicePairDataV1Ref.current = nextTwoServicesRawDataV1;
          setServicePairDataV1(DependencyGraphUtils.ProcessData(graph));
          setServicePairGraphV1RS(relationship);
          setMessageByRelationship(relationship,setServicePairGraphV1Message)
        }
      });
      GraphService.getInstance().getTaggedDependencyGraph(showEndpoint,tagV2).then((nextTwoServicesDataV2) => {
        if (nextTwoServicesDataV2){
          const {graph,relationship} = DependencyGraphUtils
            .toDetailsBetweenTwoServicesGraph(nextTwoServicesDataV2,firstSvcNodeId,secondSvcNodeId);
          const nextTwoServicesRawDataV2 = JSON.stringify(graph);
          if (rawServicePairDataV2Ref.current === nextTwoServicesRawDataV2) return;
          if (!rawServicePairDataV2Ref.current) {
            const timer = setInterval(() => {
              if (!servicePairGraphV2Ref.current) return;
              clearInterval(timer);
              setTimeout(() => {
                servicePairGraphV2Ref.current.zoom(3, 0);
                servicePairGraphV2Ref.current.centerAt(0, 0);
              }, 10);
            });
          }
          rawServicePairDataV2Ref.current = nextTwoServicesRawDataV2;
          setServicePairDataV2(DependencyGraphUtils.ProcessData(graph));
          setServicePairGraphV2RS(relationship);
          setMessageByRelationship(relationship,setServicePairGraphV2Message)
        }
      });
      setShowServicePairDiff(true);
      scrollToElement('Service Pair Details Title');
    }
    else{
      setShowServicePairDiff(false);
    }
  }, [showEndpoint,tagV1,tagV2,firstSvcNodeId,secondSvcNodeId]);

  useEffect(() => {
    if(rawDataV1 && rawDataV2){
      const nextGraphDifferenceInfo = DependencyGraphUtils.CompareTwoGraphData(rawDataV1,rawDataV2) ;
      setGraphDifferenceInfo(nextGraphDifferenceInfo);
      setAllSvcNodeIds(nextGraphDifferenceInfo.allServiceNodeIds);
    }
  }, [rawDataV1,rawDataV2]);

  const createNewVersion = async () => {
    if (!latestRawData|| !newVersion) return;
    await GraphService.getInstance().addTaggedDiffData({
      tag: newVersion,
      graphData:latestRawData,
      cohesionData:latestCohesion,
      couplingData:latestCoupling,
      instabilityData:latestInstability,
    });
    setNewVersion("");
    navigate(0); //refresh page
  };

  const deleteVersion = async () => {
    if (!tagV1 || tagV1 === "Latest") return;
    await GraphService.getInstance().deleteTaggedDiffData(tagV1);
    navigate(`/Diff`);
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
          <Typography variant="h5">Diff</Typography>
        </Grid>
        <Grid item xs={7}>
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
        <Grid item xs={5}></Grid>
        <Grid item xs={6}>
          <Card variant="outlined" className={classes.actions}>
            <FormControl fullWidth>
              <InputLabel id="tag1-label">Selected Version 1</InputLabel>
              <Select
                labelId="tag1-label"
                value={tagV1 || "latest"}
                label="Selected Version 1"
                onChange={(e) => {
                  if (e.target.value !== "latest"){
                    if(tagV2){
                      navigate(`/Diff?tagV1=${encodeURIComponent(e.target.value)}&&tagV2=${encodeURIComponent(tagV2)}`);
                    }else{
                      navigate(`/Diff?tagV1=${encodeURIComponent(e.target.value)}`);
                    }
                  }else{
                    if(tagV2){
                      navigate(`/Diff?tagV2=${encodeURIComponent(tagV2)}`);
                    }else{
                      navigate(`/Diff`);
                    }
                  }
                }}
              >
                <MenuItem value="latest">Latest</MenuItem>
                {tags.map((t, i) => (
                  <MenuItem key={`tag1-${i}`} value={t}>
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
                  disabled={!tagV1 || tagV1 === "Latest"}
                >
                  Delete
                </Button>
              </>
            </Tooltip>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card variant="outlined" className={classes.actions}>
            <FormControl fullWidth>
              <InputLabel id="tag2-label">Selected Version 2</InputLabel>
              <Select
                labelId="tag2-label"
                value={tagV2 || "latest"}
                label="Selected Version 2"
                onChange={(e) => {
                  if (e.target.value !== "latest"){
                    if(tagV1){
                      navigate(`/Diff?tagV1=${encodeURIComponent(tagV1)}&&tagV2=${encodeURIComponent(e.target.value)}`);
                    }else{
                      navigate(`/Diff?tagV2=${encodeURIComponent(e.target.value)}`);
                    }
                  }else{
                    if(tagV1){
                      navigate(`/Diff?tagV1=${encodeURIComponent(tagV1)}`);
                    }else{
                      navigate(`/Diff`);
                    }
                  }
                }}
              >
                <MenuItem value="latest">Latest</MenuItem>
                {tags.map((t, i) => (
                  <MenuItem key={`tag2-${i}`} value={t}>
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
                  disabled={!tagV2 || tagV2 === "Latest"}
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
            <Typography variant="h6">Graph Diff Overview</Typography>
          </Element>
        </Grid>
        <Grid item xs={gridSize}>
          <div className={classes.graphContainer}>
            <Grid item xs={12} className={classes.graphHeader}>
              <h3 className={classes.graphTitle}>Latest Version</h3>
            </Grid>
            <Suspense fallback={<Loading />}>
              <ForceGraph2D
                ref={graphV1Ref}
                width={pageSize[0] * graphWidthRate - 20}
                height={pageSize[1] * graphHeightRate - 40}
                graphData={dataV1}
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
                ref={graphV2Ref}
                width={pageSize[0] * graphWidthRate - 20}
                height={pageSize[1] * graphHeightRate - 40}
                graphData={DataV2}
                {...DiffDependencyGraphFactory.Create(
                  graphDifferenceInfo
                )}
              />
            </Suspense>
          </div>
        </Grid>
        <Grid item xs={12}>
          <Element name="Service Pair Details Title">
            <Typography variant="h6">Graph Diff Details ( between each pair of services )</Typography>
          </Element>
        </Grid>
        <Grid item xs={6}>
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
        <Grid item xs={6}>
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
            <h3 className={classes.graphMessage}>{servicePairGraphV1Message}</h3>
            <Suspense fallback={<Loading />}>
              <ForceGraph2D
                ref={servicePairGraphV1Ref}
                width={pageSize[0] * graphWidthRate - 20}
                height={pageSize[1] * graphHeightRate - 115}
                graphData={servicePairDataV1}
                {...DiffDetailDependencyGraphFactory.Create(
                  graphDifferenceInfo,
                  firstSvcNodeId,
                  secondSvcNodeId,
                  servicePairGraphV1RS
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
            <h3 className={classes.graphMessage}>{servicePairGraphV2Message}</h3>
            <Suspense fallback={<Loading />}>
              <ForceGraph2D
                ref={servicePairGraphV2Ref}
                width={pageSize[0] * graphWidthRate - 20}
                height={pageSize[1] * graphHeightRate - 115}
                graphData={servicePairDataV2}
                {...DiffDetailDependencyGraphFactory.Create(
                  graphDifferenceInfo,
                  firstSvcNodeId,
                  secondSvcNodeId,
                  servicePairGraphV2RS
                )}
              />
            </Suspense>

          </div>
        </Grid>
        <Grid item xs={12}>
          <Element name="Insight Diff">
            <Typography variant="h6">Insight Diff</Typography>
          </Element>
        </Grid>
        <Grid item xs={gridSize - 0.5}>
          <ReactApexChart
            {...BarChartUtils.CreateBarChart(
              "Service Cohesion (Latest version)",
              cohesionV1,
              BarChartUtils.SeriesFromServiceCohesion,
              true,
              BarChartUtils.ServiceCohesionOpts(cohesionV1)
            )}
          ></ReactApexChart>
        </Grid>
        <Grid item xs={1}></Grid>
        <Grid item xs={gridSize - 0.5}>
          <ReactApexChart
            {...BarChartUtils.CreateBarChart(
              "Service Cohesion (Selected Version)",
              cohesionV2,
              BarChartUtils.SeriesFromServiceCohesion,
              true,
              BarChartUtils.ServiceCohesionOpts(cohesionV2)
            )}
          ></ReactApexChart>
        </Grid>
        <Grid item xs={gridSize - 0.5}>
          <ReactApexChart
            {...BarChartUtils.CreateBarChart(
              "Service Coupling (Latest version)",
              couplingV1,
              BarChartUtils.SeriesFromServiceCoupling,
              true,
              BarChartUtils.ServiceCouplingOpts(couplingV1)
            )}
          ></ReactApexChart>
        </Grid>
        <Grid item xs={1}></Grid>
        <Grid item xs={gridSize - 0.5}>
          <ReactApexChart
            {...BarChartUtils.CreateBarChart(
              "Service Coupling (Selected Version)",
              couplingV2,
              BarChartUtils.SeriesFromServiceCoupling,
              true,
              BarChartUtils.ServiceCouplingOpts(couplingV2)
            )}
          ></ReactApexChart>
        </Grid>
        <Grid item xs={gridSize - 0.5}>
          <ReactApexChart
            {...BarChartUtils.CreateBarChart(
              "Service Instability (Latest version)",
              instabilityV1,
              BarChartUtils.SeriesFromServiceInstability,
              false,
              BarChartUtils.ServiceInstabilityOpts(instabilityV1)
            )}
          ></ReactApexChart>
        </Grid>
        <Grid item xs={1}></Grid>
        <Grid item xs={gridSize - 0.5}>
          <ReactApexChart
            {...BarChartUtils.CreateBarChart(
              "Service Instability (Selected Version)",
              instabilityV2,
              BarChartUtils.SeriesFromServiceInstability,
              false,
              BarChartUtils.ServiceInstabilityOpts(instabilityV2)
            )}
          ></ReactApexChart>
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
