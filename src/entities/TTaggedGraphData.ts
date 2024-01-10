import { TGraphData } from "./TGraphData";

export type TTaggedGraphData = {
  _id?: string;
  tag: string;
  time?: number;
  graphData:TGraphData;
};