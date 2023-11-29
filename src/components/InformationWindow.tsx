import { FiberManualRecord, Hexagon } from "@mui/icons-material";
import { Card, Chip, Tooltip } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { TDisplayNodeInfo } from "../entities/TDisplayNodeInfo";
import Description from "./InformationDisplay/Description";

const useStyles = makeStyles(() => ({
  root: {
    position: "absolute",
    right: "1em",
    bottom: "1em",
    width: "20em",
    height: "28em",
    overflowY: "auto",
    padding: "0em 1em 1em 1em",
  },
  info: {
    display: "flex",
    flexDirection: "row",
    gap: "0.2em",
  },
  title: {
    wordWrap: "break-word",
  },
}));

export default function InformationWindow(props: {
  info: TDisplayNodeInfo | null;
}) {
  const classes = useStyles();
  return props.info ? (
    <Card className={classes.root}>
      <h2 className={classes.title}>{getTitle(props.info)}</h2>
      <div className={classes.info}>
        <Tooltip title={`Type: ${getTypeName(props.info?.type)}`}>
          <Chip
            label={getTypeName(props.info?.type)}
            color={getColorOfType(props.info?.type)}
            icon={getIcon(props.info?.type)}
          />
        </Tooltip>
        {props.info?.method ? (
          <Tooltip title={`HTTP Method: ${props.info?.method}`}>
            <Chip label={props.info?.method} color="success" />
          </Tooltip>
        ) : null}
      </div>
      <Description info={props.info} />
    </Card>
  ) : null;
}

function getTypeName(type: "EX" | "SRV" | "EP" | undefined) {
  switch (type) {
    case "EX":
      return "External Systems";
    case "SRV":
      return "Service";
    case "EP":
      return "Endpoint";
  }
  return "";
}
function getColorOfType(type: "EX" | "SRV" | "EP" | undefined) {
  switch (type) {
    case "SRV":
      return "primary";
    case "EP":
      return "secondary";
  }
  return "success";
}
function getIcon(type: "EX" | "SRV" | "EP" | undefined) {
  switch (type) {
    case "SRV":
      return <Hexagon sx={{ transform: "rotate(30deg)" }} />;
    case "EP":
      return <FiberManualRecord />;
  }
  return undefined;
}

function getTitle(info: TDisplayNodeInfo | null) {
  switch (info?.type) {
    case "EX":
      return "External System";
    case "SRV":
      return info.service;
    case "EP":
      return info.name?.split(" ")[2];
  }
  return "";
}
