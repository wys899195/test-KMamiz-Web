import { TRequestTypeUpper } from "./TRequestType";

export default interface IEndpointDataType {
  _id?: string;
  uniqueServiceName: string;
  uniqueEndpointName: string;
  service: string;
  namespace: string;
  version: string;
  labelName: string;
  method: TRequestTypeUpper;
  schemas: TEndpointDataSchema[];
}

export type TEndpointDataSchema = {
  time: string;
  status: string;
  responseSample?: any;
  responseSchema?: string;
  responseContentType?: string;
  requestSample?: any;
  requestSchema?: string;
  requestContentType?: string;
  requestParams?: TEndpointRequestParam[];
};

export type TEndpointRequestParam = {
  param: string;
  type: string;
};
