import { ApexOptions } from "apexcharts";
import ReactApexChart from "react-apexcharts";
import LineChartUtils from "../classes/LineChartUtils";

export default function LineChart(props: {
  title?: string;
  series: ApexAxisChartSeries;
  height?: number;
  overwriteOptions?: ApexOptions;
}) {
  const options: ApexOptions = {
    ...LineChartUtils.DefaultOptions(props.title || ""),
    ...props.overwriteOptions,
  };

  return (
    <ReactApexChart
      type="line"
      height={props.height || 350}
      options={options}
      series={props.series}
    ></ReactApexChart>
  );
}
