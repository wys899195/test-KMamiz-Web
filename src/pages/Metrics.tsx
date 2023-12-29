import {
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useEffect, useState } from "react";
import LineChartUtils from "../classes/LineChartUtils";
import LineChart from "../components/LineChart";
import {
  TLineChartData,
  TLineChartDataFields,
} from "../entities/TLineChartData";
import GraphService from "../services/GraphService";

const useStyles = makeStyles(() => ({
  root: {
    width: "100%",
    overflowX: "clip",
    paddingTop: "1em",
  },
  select: {
    minWidth: 130,
    marginRight: "1em",
  },
}));

export default function Metrics() {
  const classes = useStyles();
  const [lastTimes, setLastTimes] = useState<number>(1800); //display data for the last 30 minutes by default
  const [mappedHistoricalData, setMappedHistoricalData] =
    useState<TLineChartData>();

  useEffect(() => {
    const unsubscribe = [
      GraphService.getInstance().subscribeToLineChartData(
        setMappedHistoricalData,lastTimes * 1000
      ),
    ];

    return () => {
      unsubscribe.forEach((un) => un());
    };
  }, [lastTimes]);

  const areaCharts: {
    name: string;
    field: TLineChartDataFields;
    options?: any;
  }[] = [
    { name: "Requests", field: "requests" },
    {
      name: "Risks",
      field: "risk",
      options: {
        yaxis: {
          max: 1,
          min: 0,
        },
      },
    },
    { name: "RequestErrors", field: "requestErrors" },
    { name: "ServerErrors", field: "serverErrors" },
    { name: "Latency (Coefficient of Variation)", field: "latencyCV" },
    { name: "Latency (Mean)(單位：毫秒) test ", field: "latencyMean" }
  ];

  return (
    <Box className={classes.root}>
      <Grid container>
      <Grid item xs={12} margin="1em 1em 0 0">
          <FormControl className={classes.select}>
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
      </Grid>
        {mappedHistoricalData
          ? areaCharts.map((c) => (
              <Grid key={c.name} item xs={6}>
                <LineChart
                  title={c.name}
                  series={LineChartUtils.MappedBaseDataToSeriesData(
                    mappedHistoricalData,
                    c.field
                  )}
                  overwriteOptions={c.options}
                />
              </Grid>
            ))
          : null}

      </Grid>
    </Box>
  );
}
