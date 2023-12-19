import { TRequestTypeUpper } from "./TRequestType";

export type THistoricalData = {
  _id?: string;
  date: Date;
  services: THistoricalServiceInfo[];
};

export type THistoricalServiceInfo = {
  _id?: string;
  uniqueServiceName: string;
  date: Date;
  service: string;
  namespace: string;
  version: string;
  requests: number;
  serverErrors: number;
  requestErrors: number;
  risk?: number;
  latencyMean: number;
  latencyCV: number;
  endpoints: THistoricalEndpointInfo[];
};

export type THistoricalEndpointInfo = {
  uniqueServiceName: string;
  uniqueEndpointName: string;
  labelName: string;
  method: TRequestTypeUpper;
  requests: number;
  serverErrors: number;
  requestErrors: number;
  latencyMean: number;
  latencyCV: number;
};
