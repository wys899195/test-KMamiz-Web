export type TTaggedInterface = {
  _id?: string;
  uniqueLabelName: string;
  userLabel: string;
  timestamp?: number;
  requestSchema: string;
  responseSchema: string;
  boundToSwagger?: boolean;
};
