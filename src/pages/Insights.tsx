import { makeStyles } from "@mui/styles";
import { Box, Grid } from "@mui/material";
import { useRef, useEffect, useState } from "react";
import { TChordData } from "../entities/TChordData";
import GraphService from "../services/GraphService";
import Chord from "../components/Chord";
import { Unsubscribe } from "../services/DataView";
import ReactApexChart from "react-apexcharts";
import BarChartUtils from "../classes/BarChartUtils";
import { TTotalServiceInterfaceCohesion } from "../entities/TTotalServiceInterfaceCohesion";
import { TServiceInstability } from "../entities/TServiceInstability";
import { TServiceCoupling } from "../entities/TServiceCoupling";
import { TServiceTestAPI } from "../entities/TServiceTestAPI";
import {TStatistics} from "../entities/TStatistics";
import ViewportUtils from "../classes/ViewportUtils";

const useStyles = makeStyles(() => ({
  root: {
    width: "100%",
    overflowX: "clip",
    marginBottom: "5em",
  },
  chord: {
    padding: "0.5em",
  },
}));

function handleChordNext(
  strategy: (sub: (data?: TChordData) => void) => Unsubscribe,
  setFunc: React.Dispatch<React.SetStateAction<TChordData | undefined>>,
  ref: React.MutableRefObject<TChordData | undefined>
) {
  return strategy((data) => {
    if (data && JSON.stringify(data) !== JSON.stringify(ref.current)) {
      setFunc(data);
      ref.current = data;
    }
  });
}

export default function Insights() {
  const classes = useStyles();
  const sChordRef = useRef<TChordData>();
  const iChordRef = useRef<TChordData>();
  const [sChord, setSChord] = useState<TChordData>();
  const [iChord, setIChord] = useState<TChordData>();
  const [cohesion, setCohesion] = useState<TTotalServiceInterfaceCohesion[]>(
    []
  );
  const [coupling, setCoupling] = useState<TServiceCoupling[]>([]);
  const [instability, setInstability] = useState<TServiceInstability[]>([]);
  const [testAPI, settestAPI] = useState<TServiceTestAPI []>([]);
  // const [serviceStatistics,setServiceStatistics] = useState<TStatistics>();
  // const [lastTimes, setLastTimes] = useState<number>(0);
  const [size, setSize] = useState(12);

  useEffect(() => {
    const unsubscribe = [
      handleChordNext(
        GraphService.getInstance().subscribeToDirectChord,
        setSChord,
        sChordRef
      ),
      handleChordNext(
        GraphService.getInstance().subscribeToInDirectChord,
        setIChord,
        iChordRef
      ),
      GraphService.getInstance().subscribeToServiceCohesion((data) => {
        if (JSON.stringify(data) !== JSON.stringify(cohesion)) {
          setCohesion(data);
        }
      }),
      GraphService.getInstance().subscribeToServiceCoupling((data) => {
        if (JSON.stringify(data) !== JSON.stringify(coupling)) {
          setCoupling(data);
        }
      }),
      GraphService.getInstance().subscribeToServiceInstability((data) => {
        if (JSON.stringify(data) !== JSON.stringify(instability)) {
          setInstability(data);
        }
      }),
      GraphService.getInstance().subscribeToTestAPI((data) => {
        if (JSON.stringify(data) !== JSON.stringify(testAPI)) {
          settestAPI(data);
        }
      }),
      // GraphService.getInstance().subscribeToServiceHistoricalStatistics(
      //   setServiceStatistics
      // ),
      // GraphService.getInstance().subscribeToServiceHistoricalStatistics((data) => {
      //   if (JSON.stringify(data) !== JSON.stringify(serviceStatistics)) {
      //     setServiceStatistics(data);
      //   }
      // }),
      ViewportUtils.getInstance().subscribe(([vw]) =>
        setSize(vw > 1500 ? 6 : 12)
      ),
    ];

    return () => {
      unsubscribe.forEach((un) => un());
    };
  }, []);

  return (
    <Box className={classes.root}>
      <Grid container>
        <Grid item xs={6} className={classes.chord}>
          {sChord && <Chord title="Service Dependencies" chordData={sChord} />}
        </Grid>
        <Grid item xs={6} className={classes.chord}>
          {iChord && (
            <Chord title="Indirect Service Dependencies" chordData={iChord} />
          )}
        </Grid>
        <Grid item xs={size}>
          <ReactApexChart
            {...BarChartUtils.CreateBarChart(
              "Service Cohesion",
              cohesion,
              BarChartUtils.SeriesFromServiceCohesion,
              true,
              BarChartUtils.ServiceCohesionOpts(cohesion)
            )}
          ></ReactApexChart>
        </Grid>
        <Grid item xs={size}>
          <ReactApexChart
            {...BarChartUtils.CreateBarChart(
              "Service Coupling",
              coupling,
              BarChartUtils.SeriesFromServiceCoupling,
              true,
              BarChartUtils.ServiceCouplingOpts(coupling)
            )}
          ></ReactApexChart>
        </Grid>
        <Grid item xs={size}>
          <ReactApexChart
            {...BarChartUtils.CreateBarChart(
              "Service Instability",
              instability,
              BarChartUtils.SeriesFromServiceInstability,
              false,
              BarChartUtils.ServiceInstabilityOpts(instability)
            )}
          ></ReactApexChart>
        </Grid>
        <Grid item xs={size}>
          <ReactApexChart
            {...BarChartUtils.CreateBarChart(
              "Test Test",
              testAPI,
              BarChartUtils.SeriesFromServiceTestAPI,
              false,
              BarChartUtils.ServiceTestAPIOpts(testAPI)
            )}
          ></ReactApexChart>
        </Grid>
        {/* <Grid item xs={size}>
          <ReactApexChart
            {...BarChartUtils.CreateBarChart(
              "Service Instability (SDP)",
              instability,
              BarChartUtils.InstabilitySeriesFromServiceInstability
            )}
          ></ReactApexChart>
        </Grid> */}
      </Grid>
    </Box>
  );
}
