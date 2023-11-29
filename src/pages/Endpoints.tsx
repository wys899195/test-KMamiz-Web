import {
  Grid,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useEffect, useMemo, useState } from "react";
import { TEndpointLabel } from "../entities/TEndpointLabel";
import DataService from "../services/DataService";
import LabelTable from "../components/LabelEditor/LabelTable";
import RuleCustomizer from "../components/LabelEditor/RuleCustomizer";
import RuleDisplay from "../components/LabelEditor/RuleDisplay";
import { useNavigate, useLocation } from "react-router-dom";

export type EndpointRowType = {
  id: number;
  version: string;
  method: string;
  path: string;
  label: string;
  url: string;
};

const useStyles = makeStyles(() => ({
  root: {
    width: "100%",
  },
  table: {
    height: "400px",
  },
  select: {
    minWidth: 130,
    marginRight: "1em",
  },
}));
export default function Endpoints() {
  const classes = useStyles();
  const navigate = useNavigate();
  const { search } = useLocation();
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const [namespace, setNamespace] = useState<string>("");
  const [service, setService] = useState<string>("");
  const [version, setVersion] = useState<string>("");
  const [serviceTree, setServiceTree] =
    useState<Map<string, Map<string, Set<string>>>>();
  const [rowMap, setRowMap] = useState<Map<string, EndpointRowType[]>>();
  const [userDefined, setUserDefined] = useState<TEndpointLabel>();

  const processLabelMap = (labelMap: [string, string][]) => {
    const endpointRowMap = new Map<string, EndpointRowType[]>();
    const srvMap = new Map<string, Map<string, Set<string>>>();

    labelMap.forEach(([e, l], id) => {
      const [service, namespace, version, method, url] = e.split("\t");
      const path = url.replace(/(http|https):\/\/[^/]*/, "");

      const key = `${service}\t${namespace}\t${version}`;
      endpointRowMap.set(
        key,
        (endpointRowMap.get(key) || []).concat([
          {
            id,
            version,
            method,
            path,
            label: l,
            url,
          },
        ])
      );

      const prev = srvMap.get(namespace) || new Map<string, Set<string>>();
      prev.set(service, (prev.get(service) || new Set<string>()).add(version));
      srvMap.set(namespace, prev);
    });

    setRowMap(endpointRowMap);
    setServiceTree(srvMap);
  };

  const processUserDefinedLabel = (labels: TEndpointLabel | null) => {
    if (labels) setUserDefined(labels);
  };

  const loadData = () => {
    DataService.getInstance().getLabelMap().then(processLabelMap);
    DataService.getInstance()
      .getUserDefinedLabels()
      .then(processUserDefinedLabel);
  };

  useEffect(() => {
    loadData();

    const q = query.get("q");
    if (q) {
      const [namespace, service, version] = atob(decodeURIComponent(q)).split(
        "\t"
      );
      setNamespace(namespace);
      setService(service);
      setVersion(version);
    }
  }, []);
  useEffect(() => {
    const url = `${namespace}${service && `\t${service}`}${
      version && `\t${version}`
    }`;
    const encoded = encodeURIComponent(btoa(url));
    navigate(`/endpoints${encoded && `?q=${encoded}`}`, {
      replace: true,
    });
  }, [namespace, service, version]);

  return (
    <Box className={classes.root}>
      <Grid container padding={1} spacing={1}>
        <Grid item xs={12}>
          <Typography variant="h5">Endpoints</Typography>
        </Grid>
        <Grid item xs={12} margin="1em 1em 0 0">
          <FormControl className={classes.select}>
            <InputLabel id="ns-label">Namespace</InputLabel>
            <Select
              labelId="ns-label"
              label="Namespace"
              onChange={(e) => setNamespace(e.target.value)}
              value={namespace}
            >
              {[...(serviceTree?.keys() || [])].map((ns, id) => (
                <MenuItem key={`ns-item-${id}`} value={ns}>
                  {ns}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl className={classes.select}>
            <InputLabel id="srv-label">Service</InputLabel>
            <Select
              labelId="srv-label"
              label="Service"
              onChange={(e) => setService(e.target.value)}
              value={service}
            >
              {[...(serviceTree?.get(namespace)?.keys() || [])].map(
                (srv, id) => (
                  <MenuItem key={`srv-item-${id}`} value={srv}>
                    {srv}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>
          <FormControl className={classes.select}>
            <InputLabel id="ver-label">Version</InputLabel>
            <Select
              labelId="ver-label"
              label="Version"
              onChange={(e) => setVersion(e.target.value)}
              value={version}
            >
              {[...(serviceTree?.get(namespace)?.get(service) || [])].map(
                (ver, id) => (
                  <MenuItem key={`ver-item-${id}`} value={ver}>
                    {ver}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <LabelTable
            namespace={namespace}
            service={service}
            version={version}
            rowMap={rowMap}
          />
        </Grid>
        {rowMap && namespace && service && version && (
          <>
            <Grid item xs={12}>
              <Typography variant="h5">Custom Rules</Typography>
            </Grid>
            <Grid item xs={6}>
              <RuleDisplay
                namespace={namespace}
                service={service}
                version={version}
                userDefinedLabels={userDefined}
                triggerUpdate={loadData}
              />
            </Grid>
            <Grid item xs={6}>
              <RuleCustomizer
                namespace={namespace}
                service={service}
                version={version}
                rowMap={rowMap}
                triggerUpdate={loadData}
              />
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
}
