import { TGraphData } from "./TGraphData";
import { TTotalServiceInterfaceCohesion } from "./TTotalServiceInterfaceCohesion";
import { TServiceCoupling } from "./TServiceCoupling";
import { TServiceInstability } from "./TServiceInstability";

export type TTaggedDiffData = {
  _id?: string;
  tag: string;
  time?: number;
  graphData:TGraphData;
  cohesionData:TTotalServiceInterfaceCohesion[];
  couplingData:TServiceCoupling[];
  instabilityData:TServiceInstability[];
};

