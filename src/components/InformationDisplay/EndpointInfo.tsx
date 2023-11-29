import { Chip, List, ListItem, ListItemText, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import TEndpointDataType from "../../entities/TEndpointDataType";
import DataService from "../../services/DataService";
import CodeDisplay from "../CodeDisplay";

export default function EndpointInfo(props: { uniqueLabelName: string }) {
  const [dataType, setDataType] = useState<TEndpointDataType>();
  useEffect(() => {
    const unSub = DataService.getInstance().subscribeToEndpointDataType(
      setDataType,
      props.uniqueLabelName
    );
    return () => {
      unSub();
    };
  }, [props.uniqueLabelName]);

  const schema = dataType?.schemas
    ?.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .find((s) => s.status.startsWith("2"));
  const resSchema = schema?.responseSchema;
  const reqSchema = schema?.requestSchema;
  const reqTime = schema?.time;
  const isReqJson = schema?.requestContentType === "application/json";
  const isResJson = schema?.responseContentType === "application/json";

  return (
    <div>
      {(schema?.requestContentType || schema?.responseContentType) && (
        <List>
          {schema?.requestContentType && (
            <ListItem disablePadding>
              <Tooltip
                title={`Request Content-Type: "${schema.requestContentType}"`}
              >
                <ListItemText
                  primary={
                    <Chip
                      color="primary"
                      size="small"
                      label={`REQ "${schema.requestContentType}"`}
                    />
                  }
                />
              </Tooltip>
            </ListItem>
          )}
          {schema?.responseContentType && (
            <ListItem disablePadding>
              <Tooltip
                title={`Response Content-Type: "${schema.responseContentType}"`}
              >
                <ListItemText
                  primary={
                    <Chip
                      color="primary"
                      size="small"
                      label={`RES "${schema.responseContentType}"`}
                    />
                  }
                />
              </Tooltip>
            </ListItem>
          )}
        </List>
      )}
      {isReqJson && reqSchema && (
        <div>
          <h4>Request Schema (Typescript)</h4>
          {reqTime && (
            <small>
              <i>Schema from: {reqTime}</i>
            </small>
          )}
          <CodeDisplay code={reqSchema} />
        </div>
      )}
      {isResJson && resSchema && (
        <div>
          <h4>Response Schema (Typescript)</h4>
          {reqTime && (
            <small>
              <i>Schema from: {reqTime}</i>
            </small>
          )}
          <CodeDisplay code={resSchema} />
        </div>
      )}
    </div>
  );
}
