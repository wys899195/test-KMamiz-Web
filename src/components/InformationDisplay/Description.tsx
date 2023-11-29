import { Chip, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import { TDisplayNodeInfo } from "../../entities/TDisplayNodeInfo";
import EndpointInfo from "./EndpointInfo";
import ServiceInfo from "./ServiceInfo";
import { makeStyles } from "@mui/styles";
import { Unsubscribe } from "../../services/DataView";
import { TRequestInfoChartData } from "../../entities/TRequestInfoChartData";
import GraphService from "../../services/GraphService";
import RequestInfoChart from "./RequestInfoChart";

const useStyles = makeStyles(() => ({
  info: {
    margin: "0.5em 0",
    display: "flex",
    flexDirection: "row",
    gap: "0.2em",
  },
}));

export default function Description(props: { info: TDisplayNodeInfo | null }) {
  const classes = useStyles();
  const [data, setData] = useState<TRequestInfoChartData>();

  useEffect(() => {
    let unSub: Unsubscribe;

    if (props.info && props.info.type !== "EX") {
      const uniqueName =
        props.info.type === "SRV"
          ? `${props.info.service!}\t${props.info.namespace!}`
          : `${props.info.uniqueServiceName!}\t${props.info.method!}\t${props
              .info.labelName!}`;
      unSub = GraphService.getInstance().subscribeToRequestInfoChartData(
        (data) => setData(data),
        uniqueName,
        props.info.type === "SRV"
      );
    }
    return () => {
      if (unSub) unSub();
    };
  }, [props.info]);

  switch (props.info?.type) {
    case "SRV":
      return (
        <div>
          <div className={classes.info}>
            <Tooltip title="Namespace">
              <Chip color="success" size="small" label={props.info.namespace} />
            </Tooltip>
          </div>
          <RequestInfoChart chartData={data} />
          <ServiceInfo
            service={props.info.service!}
            namespace={props.info.namespace!}
          />
        </div>
      );
    case "EP":
      return (
        <div>
          <div className={classes.info}>
            <Tooltip title={`Namespace: ${props.info.namespace}`}>
              <Chip color="success" size="small" label={props.info.namespace} />
            </Tooltip>
            <Tooltip title={`Service: ${props.info.service}`}>
              <Chip color="info" size="small" label={props.info.service} />
            </Tooltip>
            <Tooltip title={`Version: ${props.info.version}`}>
              <Chip color="warning" size="small" label={props.info.version} />
            </Tooltip>
          </div>
          <RequestInfoChart chartData={data} />
          <EndpointInfo
            uniqueLabelName={`${props.info.uniqueServiceName!}\t${props.info
              .method!}\t${props.info.labelName!}`}
          />
        </div>
      );
    default:
      return <div></div>;
  }
}
