import { Box, Card } from "@mui/material";
import { ApexOptions } from "apexcharts";
import LineChartUtils from "../../classes/LineChartUtils";
import { TRequestInfoChartData } from "../../entities/TRequestInfoChartData";
import LineChart from "../LineChart";
import RequestDonutChart from "../RequestDonutChart";

export type RequestInfoChartProps = {
  chartData?: TRequestInfoChartData;
};

function createOverwriteChartOptions(title: string) {
  const defaultOptions = LineChartUtils.DefaultOptions(title);
  const overwriteOptions: ApexOptions = {
    ...defaultOptions,
    chart: {
      ...defaultOptions.chart,
    },
    title: {
      ...defaultOptions.title,
      align: "left",
    },
  };
  return overwriteOptions;
}

export default function RequestInfoChart(props: RequestInfoChartProps) {
  const show =
    props.chartData &&
    (props.chartData.totalRequestCount ||
      props.chartData.totalClientErrors ||
      props.chartData.totalServerErrors);

  return show ? (
    <Box display="flex" flexDirection="column" gap={1}>
      <Card variant="outlined">
        <RequestDonutChart
          series={[
            props.chartData!.totalRequestCount,
            props.chartData!.totalClientErrors,
            props.chartData!.totalServerErrors,
          ]}
        />
      </Card>
      <Card variant="outlined">
        <LineChart
          height={200}
          overwriteOptions={createOverwriteChartOptions("Request Details")}
          series={LineChartUtils.MapRequestInfoToRequestSeriesData(
            props.chartData!
          )}
        />
      </Card>
      <Card variant="outlined">
        <LineChart
          height={200}
          overwriteOptions={createOverwriteChartOptions("Latency CV")}
          series={LineChartUtils.MapRequestInfoToLatencySeriesData(
            props.chartData!
          )}
        />
      </Card>
    </Box>
  ) : (
    <></>
  );
}
