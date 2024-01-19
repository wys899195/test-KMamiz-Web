import { ApexOptions } from "apexcharts";
import { Props } from "react-apexcharts";
import { TServiceCoupling } from "../entities/TServiceCoupling";
import { TServiceInstability } from "../entities/TServiceInstability";
import {TServiceStatistics} from "../entities/TStatistics";
import { TTotalServiceInterfaceCohesion } from "../entities/TTotalServiceInterfaceCohesion";
import { Color } from "./ColorUtils";

export default class BarChartUtils {
  static CreateBarChart<T extends { name: string }>(
    title: string,
    data: T[],
    toSeriesStrategy: (_: T[]) => any[],
    stacked = false,
    overwriteOpts: Props = {},
    height = 600
  ): Props {
    return {
      type: "bar",
      height,
      options: {
        ...BarChartUtils.DefaultOptions(
          title,
          stacked,
          data.map(({ name }) => name)
        ),
        ...overwriteOpts,
      },
      series: toSeriesStrategy(data),
    };
  }

  static DefaultOptions(
    title: string,
    stacked: boolean,
    categories: any[]
  ): ApexOptions {
    return {
      title: {
        text: title,
        align: "center",
      },
      chart: {
        type: "bar",
        stacked,
        animations: {
          enabled: false,
        },
      },
      plotOptions: {
        bar: {
          dataLabels: {
            position: "top",
          },
        },
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: "12px",
        },
      },
      stroke: {
        show: true,
        width: 1,
        colors: ["transparent"],
      },
      tooltip: {
        shared: true,
        intersect: false,
      },
      xaxis: {
        categories,
        labels: {
          trim: true,
        },
      },
      legend: {
        position: "top",
        showForSingleSeries: true,
      },
    };
  }

  static StackMixedChartOverwriteOpts<T>(
    markerName: string,
    data: T[],
    strategy: {
      x: (d: T) => string | number;
      y: (d: T) => number;
      markerLabel: (d: T) => string;
      tooltip: (
        y: number,
        seriesIndex: number,
        dataPointIndex: number
      ) => string;
    },
    overwriteYAxis = 0
  ) {
    const color = Color.generateFromString(markerName);
    return {
      stroke: {
        show: false,
      },
      dataLabels: {
        enabledOnSeries: [0, 1],
      },
      annotations: {
        points: data.map((d) => ({
          x: strategy.x(d),
          y: BarChartUtils.roundToDisplay(strategy.y(d)),
          yAxisIndex: overwriteYAxis,
          marker: {
            size: 5,
            shape: "square",
            fillColor: color.hex,
            strokeColor: color.darker(30).hex,
          },
          label: {
            borderColor: color.darker(30).hex,
            borderWidth: 2,
            offsetX: 15,
            offsetY: 15,
            textAnchor: "start",
            style: {
              color: "#fff",
              fontWeight: "bold",
              background: color.darker(50).hex,
              padding: {
                top: 4,
              },
            },

            text: strategy.markerLabel(d),
          },
        })),
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: (
            y: number,
            {
              seriesIndex,
              dataPointIndex,
            }: { seriesIndex: number; dataPointIndex: number }
          ) => strategy.tooltip(y, seriesIndex, dataPointIndex),
        },
      },
    };
  }

  static ServiceCohesionOpts(
    cohesions: TTotalServiceInterfaceCohesion[]
  ): ApexOptions {
    const base = BarChartUtils.StackMixedChartOverwriteOpts(
      "Total Interface Cohesion (TSIC)",
      cohesions,
      {
        x: (d) => d.name,
        y: (d) => d.totalInterfaceCohesion,
        markerLabel: (d) =>
          `TSIC: ${BarChartUtils.roundToDisplay(d.totalInterfaceCohesion)}`,
        tooltip: (y, seriesIndex, dataPointIndex) => {
          if (seriesIndex === 2) {
            const c = BarChartUtils.roundToDisplay(
              cohesions[dataPointIndex].totalInterfaceCohesion
            );
            return c.toString();
          }
          return y.toString();
        },
      },
      2
    );

    const colorSidc = Color.generateFromString("Data Cohesion (SIDC)").darker(
      50
    );
    const colorSiuc = Color.generateFromString("Usage Cohesion (SIUC)").darker(
      50
    );
    const mixedColor = colorSidc.mixWith(colorSiuc);

    return {
      ...base,
      yaxis: [
        {
          title: {
            text: "SIDC + SIUC",
            style: {
              color: mixedColor.hex,
            },
          },
          ...BarChartUtils.generateTick(2),
          tickAmount: 20,
        },
        {
          show: false,
          ...BarChartUtils.generateTick(2),
        },
        {
          opposite: true,
          title: {
            text: "TSIC",
            style: {
              color: BarChartUtils.stringToColorHex(
                "Total Interface Cohesion (TSIC)"
              ),
            },
          },
          min: 0,
          max: 1,
        },
      ],
    };
  }

  static ServiceCouplingOpts(coupling: TServiceCoupling[]): ApexOptions {
    const base = BarChartUtils.StackMixedChartOverwriteOpts(
      "Absolute Criticality (ACS)",
      coupling,
      {
        x: (d) => d.name,
        y: (d) => d.acs,
        markerLabel: (d) => `ACS: ${BarChartUtils.roundToDisplay(d.acs)}`,
        tooltip: (y, seriesIndex, dataPointIndex) => {
          if (seriesIndex === 2) {
            const c = BarChartUtils.roundToDisplay(
              coupling[dataPointIndex].acs
            );
            return c.toString();
          }
          return y.toString();
        },
      },
      2
    );

    const { maxY, maxRY } = coupling.reduce(
      ({ maxY, maxRY }, { ais, ads, acs }) => ({
        maxY: Math.max(maxY, ais + ads),
        maxRY: Math.max(maxRY, acs),
      }),
      { maxY: 0, maxRY: 0 }
    );

    const colorAis = Color.generateFromString(
      "Absolute Importance (AIS)"
    ).darker(50);
    const colorAds = Color.generateFromString(
      "Absolute Dependence (ADS)"
    ).darker(50);
    const mixedColor = colorAis.mixWith(colorAds);

    return {
      ...base,
      yaxis: [
        {
          title: {
            text: "AIS + ADS",
            style: {
              color: mixedColor.hex,
            },
          },
          ...BarChartUtils.generateTick(maxY),
        },
        {
          show: false,
          ...BarChartUtils.generateTick(maxY),
        },
        {
          opposite: true,
          title: {
            text: "ACS",
            style: {
              color: BarChartUtils.stringToColorHex(
                "Absolute Criticality (ACS)"
              ),
            },
          },
          ...BarChartUtils.generateTick(maxRY),
        },
      ],
    };
  }

  static ServiceStatisticsOpts(
    statistics: TServiceStatistics[]
  ): ApexOptions {
    const base = BarChartUtils.StackMixedChartOverwriteOpts(
      "Absolute Criticality (ACS)",
      statistics,
      {
        x: (d) => d.name,
        y: (d) => d.serverErrorRate,
        markerLabel: (d) =>
          `ACS: ${BarChartUtils.roundToDisplay(d.serverErrorRate)}`,
        tooltip: (y, seriesIndex, dataPointIndex) => {
          if (seriesIndex === 2) {
            const c = BarChartUtils.roundToDisplay(
              statistics[dataPointIndex].serverErrorRate
            );
            return c.toString();
          }
          return y.toString();
        },
      },
      2
    );

    const { maxY, maxRY } = statistics.reduce(
      ({ maxY, maxRY }, { latencyMean,serverErrorRate, requestErrorsRate}) => ({
        maxY: Math.max(maxY, latencyMean),
        maxRY: Math.max(maxRY, Math.max(serverErrorRate,requestErrorsRate)),
      }),
      { maxY: 0, maxRY: 0 }
    );

    return {
      ...base,
      yaxis: [
        {
          title: {
            text: "latencyMean",
            style: {
              color: BarChartUtils.stringToColorHex("latencyMean"),
            },
          },
          ...BarChartUtils.generateTick(maxY),
        },
        {
          opposite: true,
          title: {
            text: "serverErrorRate",
            style: {
              color: BarChartUtils.stringToColorHex("serverErrorRate"),
            },
          },
          ...BarChartUtils.generateTick(maxRY),
        },
        {
          opposite: true,
          title: {
            text: "requestErrorsRate",
            style: {
              color: BarChartUtils.stringToColorHex("requestErrorsRate"),
            },
          },
          ...BarChartUtils.generateTick(maxRY),
        },
      ],
    };
  }

  static ServiceInstabilityOpts(
    instability: TServiceInstability[]
  ): ApexOptions {
    const base = BarChartUtils.StackMixedChartOverwriteOpts(
      "Instability (SDP)",
      instability,
      {
        x: (d) => d.name,
        y: (d) => d.instability,
        markerLabel: (d) =>
          `SDP: ${BarChartUtils.roundToDisplay(d.instability)}`,
        tooltip: (y, seriesIndex, dataPointIndex) => {
          if (seriesIndex === 2) {
            const c = BarChartUtils.roundToDisplay(
              instability[dataPointIndex].instability
            );
            return c.toString();
          }
          return y.toString();
        },
      },
      2
    );

    return {
      ...base,
      yaxis: [
        {
          title: {
            text: "FanOut",
            style: {
              color: BarChartUtils.stringToColorHex("FanOut"),
            },
          },
        },
        {
          title: {
            text: "FanIn",
            style: {
              color: BarChartUtils.stringToColorHex("FanIn"),
            },
          },
        },
        {
          opposite: true,
          title: {
            text: "Instability (SDP)",
            style: {
              color: BarChartUtils.stringToColorHex("Instability (SDP)"),
            },
          },
          min: 0,
          max: 1,
        },
      ],
    };
  }

  static SeriesFromServiceCohesion(
    cohesions: TTotalServiceInterfaceCohesion[]
  ) {
    const fields = [
      {
        f: "dataCohesion",
        name: "Data Cohesion (SIDC)",
      },
      {
        f: "usageCohesion",
        name: "Usage Cohesion (SIUC)",
      },
      {
        f: "totalInterfaceCohesion",
        name: "Total Interface Cohesion (TSIC)",
      },
    ];
    const base = BarChartUtils.mapFieldsToSeries(fields, cohesions);
    return BarChartUtils.markFieldToLine(
      "Total Interface Cohesion (TSIC)",
      base
    );
  }

  static SeriesFromServiceCoupling(coupling: TServiceCoupling[]) {
    const fields = [
      {
        f: "ais",
        name: "Absolute Importance (AIS)",
      },
      {
        f: "ads",
        name: "Absolute Dependence (ADS)",
      },
    ];
    const base = BarChartUtils.mapFieldsToSeries(fields, coupling);
    return BarChartUtils.markFieldToLine("Absolute Criticality (ACS)", base);
  }

  static SeriesFromServiceStatistics(statistics: TServiceStatistics[]) {
    const fields = [
      {
        f: "latencyMean",
        name: "latencyMean",
      },
      {
        f: "serverErrorRate",
        name: "serverErrorRate",
      },
      {
        f: "requestErrorsRate",
        name: "requestErrorsRate",
      },
    ];
    const base = BarChartUtils.mapFieldsToSeries(fields, statistics);
    return BarChartUtils.markFieldToLine("", base);
  }

  static SeriesFromServiceInstability(instability: TServiceInstability[]) {
    const fields = [
      { f: "dependingOn", name: "FanOut" },
      { f: "dependingBy", name: "FanIn" },
      { f: "instability", name: "Instability (SDP)" },
    ];
    const base = BarChartUtils.mapFieldsToSeries(fields, instability);
    return BarChartUtils.markFieldToLine("Instability (SDP)", base);
  }

  private static stringToColorHex(str: string) {
    return Color.generateFromString(str).darker(50).hex;
  }

  private static roundToDisplay(n: number) {
    return Math.round(n * 100) / 100;
  }

  private static mapFieldsToSeries(
    fields: { f: string; name: string }[],
    data: any[]
  ) {
    return fields.map(({ f, name }) => ({
      name,
      color: BarChartUtils.stringToColorHex(name),
      data: data.map((c) => BarChartUtils.roundToDisplay(c[f])),
    }));
  }

  private static mapFieldsToSeriesForTestAPI(
    fields: { f: string; name: string }[],
    data: any[]
  ) {
    return fields.map(({ f, name }) => ({
      name,
      color: BarChartUtils.stringToColorHex(name),
      data: data.map((c) => BarChartUtils.roundToDisplay(c[f.split("+")[0]] + c[f.split("+")[1]])),
    }));
  }

  private static generateTick(max: number) {
    return {
      max,
      min: 0,
      tickAmount: max,
    };
  }

  private static markFieldToLine(
    fName: string,
    series: ApexAxisChartSeries
  ): ApexAxisChartSeries {
    return series.map((s) => {
      if (s.name === fName) {
        return {
          ...s,
          data: s.data.map(() => 0),
          type: "line",
        };
      }
      return { ...s, type: "column" };
    });
  }
}
