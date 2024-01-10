import { makeStyles } from "@mui/styles";
import { 
  Box, 
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper, 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell,
  TableContainer 
} from "@mui/material";
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
import {TStatistics,TServiceStatistics} from "../entities/TStatistics";
import ViewportUtils from "../classes/ViewportUtils";
import ServiceStatisticsTable from '../components/ServiceStatisticsTable';
const useStyles = makeStyles(() => ({
  root: {
    width: "100%",
    overflowX: "clip",
    marginBottom: "5em",
  },
  chord: {
    padding: "0.5em",
  },
  select: {
    minWidth: 130,
    marginRight: "1em",
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

function createData(name:string, calories:number, fat:number, carbs:number, protein:number) {
  return { name, calories, fat, carbs, protein };
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
  const [statistics,setStatistics] = useState<TServiceStatistics[]>([]);
  const [lastTimes, setLastTimes] = useState<number>(86400);
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
      // GraphService.getInstance().subscribeToTestAPI((data) => {
      //   if (JSON.stringify(data) !== JSON.stringify(testAPI)) {
      //     settestAPI(data);
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
  useEffect(() => {
    const unsubscribeStatistics = [
      GraphService.getInstance().subscribeToServiceHistoricalStatistics(
        setStatistics,lastTimes * 1000
      ),
    ];
    return () => {
      unsubscribeStatistics.forEach((uns) => uns());
    };
  }, [lastTimes]);

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
        {/* <Grid item xs={size}>
          <ReactApexChart
            {...BarChartUtils.CreateBarChart(
              "Test statistics",
              statistics,
              BarChartUtils.SeriesFromServiceStatistics,
              false,
              BarChartUtils.ServiceStatisticsOpts(statistics)
            )}
          ></ReactApexChart>
        </Grid> */}
        {/* <Grid item xs={size}>
          <TableContainer component={Paper}>
            <Table  size="small" aria-label="a dense table">
              <TableHead>
                <TableRow>
                  <TableCell>Dessert (100g serving)</TableCell>
                  <TableCell align="right">Calories</TableCell>
                  <TableCell align="right">Fat&nbsp;(g)</TableCell>
                  <TableCell align="right">Carbs&nbsp;(g)</TableCell>
                  <TableCell align="right">Protein&nbsp;(g)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell component="th" scope="row">
                      {row.name}
                    </TableCell>
                    <TableCell align="right">{row.calories}</TableCell>
                    <TableCell align="right">{row.fat}</TableCell>
                    <TableCell align="right">{row.carbs}</TableCell>
                    <TableCell align="right">{row.protein}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid> */}
        <Grid item xs={12}></Grid>
        <Grid item xs={0.5}></Grid>
        <Grid item xs={11}>
          <FormControl className={classes.select} >
            <InputLabel id="lt-label">LastTimes</InputLabel>
            <Select
              labelId="lt-label"
              label="LastTimes"
              onChange={(e) => setLastTimes(+e.target.value)}
              value={lastTimes}
            >
            <MenuItem key={`lt-item-10m`} value={600}>
              {'last 10 min'}
            </MenuItem>
            <MenuItem key={`lt-item-30m`} value={1800}>
              {'last 30 min'}
            </MenuItem>
            <MenuItem key={`lt-item-1h`} value={3600}>
              {'last 1 hr'}
            </MenuItem>
            <MenuItem key={`lt-item-3h`} value={10800}>
              {'last 3 hr'}
            </MenuItem>
            <MenuItem key={`lt-item-6h`} value={21600}>
              {'last 6 hr'}
            </MenuItem>
            <MenuItem key={`lt-item-12h`} value={43200}>
              {'last 12 hr'}
            </MenuItem>
            <MenuItem key={`lt-item-1d`} value={86400}>
              {'last 1 day'}
            </MenuItem>
            <MenuItem key={`lt-item-7d`} value={604800}>
              {'last 7 days'}
            </MenuItem>
            </Select>
          </FormControl>
          <ServiceStatisticsTable servicesStatistics={statistics} />
        </Grid>
        <Grid item xs={0.5}></Grid>

        
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
