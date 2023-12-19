import { Box, Grid } from "@mui/material";
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
}));

export default function Metrics() {
  const classes = useStyles();
  const [mappedHistoricalData, setMappedHistoricalData] =
    useState<TLineChartData>();

  useEffect(() => {
    const unsubscribe = [
      GraphService.getInstance().subscribeToLineChartData(
        setMappedHistoricalData
      ),
    ];

    return () => {
      unsubscribe.forEach((un) => un());
    };
  }, []);

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
