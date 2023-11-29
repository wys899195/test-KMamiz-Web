export type TDisplayNodeInfo = {
  type: "SRV" | "EP" | "EX";
  labelName: string;
  uniqueServiceName?: string;
  service?: string;
  namespace?: string;
  version?: string;
  name?: string;
  method?: string;
};
