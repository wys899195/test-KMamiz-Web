import { ApexOptions } from "apexcharts";
import ReactApexChart from "react-apexcharts";

export default function RequestDonutChart(props: {
  series: number[];
  options?: ApexOptions;
}) {
  const options: ApexOptions = {
    chart: {
      type: "donut",
    },
    labels: ["Normal Request", "4XX Errors", "5XX Errors"],
    title: {
      text: `Total Requests: ${props.series.reduce((a, b) => a + b)}`,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  return (
    <ReactApexChart options={options} series={props.series} type="donut" />
  );
}
