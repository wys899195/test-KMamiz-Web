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
import { DependencyGraphWithDifferenceFactory } from "../classes/DependencyGraphWithDifferenceFactory";
import {
  useGraphDifference,
  DependencyGraphWithDifferenceUtils,
} from "../classes/DependencyGraphWithDifferenceUtils";
import ViewportUtils from "../classes/ViewportUtils";
import GraphService from "../services/GraphService";
import Loading from "../components/Loading";
import { useLocation, useNavigate } from "react-router-dom";

const ForceGraph2D = lazy(() => import("react-force-graph-2d"));

const useStyles = makeStyles(() => ({
  root: {
    width: "100%",
    overflowX: "clip",
    marginBottom: "5em",
  },
  switchEndpoint: {
    position: "absolute",
    top: "5em",
    right: "1em",
    paddingLeft: "0.8em",
  },
  switchDifference: {
    position: "absolute",
    top: "5em",
    right: "13.5em",
    paddingLeft: "0.8em",
  },
  canvasContainer:{
    margin:'3.5em 0em 0em 0em',
    display: 'flex',
    flexWrap: 'wrap',
  },
  canvas:{
    margin:'0.6em 0.6em 0.6em 0.6em',
    border: '0.08em solid #ccc',
    boxShadow: '0.6em 0.6em 0.5em rgba(0, 0, 0, 0.1)', // 添加陰影
    float:'left',
  },
  canvasTitle:{
    margin:'1.2em 0em 0em 0em',
  },
  cavasHeader:{
    borderBottom: '0.125em dotted #ccc',
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
  const [canvasHeightRate, setCanvasHeightRate] = useState(0.65);
  const [data, setData] = useState<any>();
  const [dataBeforeProcess, setDataBeforeProcess] = useState<any>();;
  const [taggedData, setTaggedData] = useState<any>();
  const [graphDifferenceInfo, setGraphDifferenceInfo] = useGraphDifference();
  const [showEndpoint, setShowEndpoint] = useState(true);
  const [showDifference, setShowDifference] = useState(true);

  const tag = query.get("tag");
  const [tags, setTags] = useState<string[]>([]);
  const [newVersion, setNewVersion] = useState<string>("");

  useEffect(() => {
    const unsubscribe = [
      ViewportUtils.getInstance().subscribe(([vw]) =>
        setCanvasWidthRate(vw > 1250 ? 0.5 : 1)
      ),
      ViewportUtils.getInstance().subscribe(([vw]) =>
        setCanvasHeightRate(vw > 1250 ? 0.65 : 0.45)
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

  useEffect(() => {
    GraphService.getInstance().getDependencyGraph(true).then((nextBeforeProcessData) => {
      if (nextBeforeProcessData){
        setDataBeforeProcess(nextBeforeProcessData);
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
        setData(DependencyGraphWithDifferenceUtils.ProcessData(nextData));
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
        setTaggedData(DependencyGraphWithDifferenceUtils.ProcessData(nextTaggedData));
      }
    });
  }, [showEndpoint,showDifference,tag]);

  useEffect(() => {
    if(data && taggedData){
      setGraphDifferenceInfo(DependencyGraphWithDifferenceUtils.CompareTwoGraphData(data,taggedData))
    }
  }, [data,taggedData]);


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
          <Grid container padding={1} className={classes.cavasHeader}>
            <Grid item xs={5}>
              <Typography variant="h5" className={classes.canvasTitle}>Latest Version</Typography>
            </Grid>
            <Grid item xs={7}>
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
              width={size[0] * canvasWidthRate - 30}
              height={size[1] * canvasHeightRate - 50}
              graphData={data}
              {...DependencyGraphWithDifferenceFactory.Create(
                showDifference,
                graphDifferenceInfo
              )}
            />
          </Suspense>
        </div>
        <div className={classes.canvas}>
          <Grid container padding={1} className={classes.cavasHeader}>
            <Grid item xs={5}>
              <Typography variant="h5" className={classes.canvasTitle}>Historical Versions</Typography>
            </Grid>
            <Grid item xs={7}>
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
              width={size[0] * canvasWidthRate - 30}
              height={size[1] * canvasHeightRate - 50}
              graphData={taggedData}
              {...DependencyGraphWithDifferenceFactory.Create(
                showDifference,
                graphDifferenceInfo
              )}
            />
          </Suspense>
        </div>
      </div>
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
      <Card className={classes.switchDifference}>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={showDifference}
                onChange={(e) => setShowDifference(e.target.checked)}
              />
            }
            label="Show differences"
          />
        </FormGroup>
      </Card>
    </div>
  );
}