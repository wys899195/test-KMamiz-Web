import { TRequestTypeUpper } from "./TRequestType";

export type TAggregatedData = {
  _id?: string;
  fromDate: string;
  toDate: string;
  services: TAggregatedServiceInfo[];
};

export type TAggregatedServiceInfo = {
  uniqueServiceName: string;
  service: string;
  namespace: string;
  version: string;
  totalRequests: number;
  totalServerErrors: number;
  totalRequestErrors: number;
  avgRisk: number;
  avgLatencyCV: number;
  endpoints: TAggregatedEndpointInfo[];
};
export type TAggregatedEndpointInfo = {
  uniqueServiceName: string;
  uniqueEndpointName: string;
  labelName: string;
  method: TRequestTypeUpper;
  totalRequests: number;
  totalServerErrors: number;
  totalRequestErrors: number;
  avgLatencyCV: number;
};
