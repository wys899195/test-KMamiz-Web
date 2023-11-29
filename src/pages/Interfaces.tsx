import {
  Box,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import InterfaceDisplay from "../components/InterfaceDisplay";
import DataService from "../services/DataService";

type MultiLevelMap = {
  [namespace: string]: {
    [service: string]: {
      [version: string]: {
        [label: string]: {
          [method: string]: {};
        };
      };
    };
  };
};

const useStyles = makeStyles(() => ({
  root: {
    width: "100%",
  },
  select: {
    minWidth: 130,
    marginRight: "1em",
    marginBottom: "1em",
  },
}));
export default function Interfaces() {
  const classes = useStyles();
  const navigate = useNavigate();
  const { search } = useLocation();
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const [labelMap, setLabelMap] = useState<MultiLevelMap>();
  const [namespace, setNamespace] = useState<string>("");
  const [service, setService] = useState<string>("");
  const [version, setVersion] = useState<string>("");
  const [label, setLabel] = useState<string>("");
  const [method, setMethod] = useState<string>("");
  const [uniqueLabelName, setUniqueLabelName] = useState<string>("");

  useEffect(() => {
    const q = query.get("q");
    if (q) {
      const [namespace, service, version, label, method] = atob(
        decodeURIComponent(q)
      ).split("\t");
      setNamespace(namespace || "");
      setService(service || "");
      setVersion(version || "");
      setLabel(label || "");
      setMethod(method || "");
    }

    DataService.getInstance()
      .getLabelMap()
      .then((res) => {
        const newLabelMap: MultiLevelMap = {};
        res.forEach(([ep, label]) => {
          const [service, namespace, version, method] = ep.split("\t");
          let root = newLabelMap;
          [namespace, service, version, label, method].forEach((l) => {
            if (!root[l]) root[l] = {};
            root = root[l];
          });
        });
        setLabelMap(newLabelMap);
      });
  }, []);
  useEffect(() => {
    if (method) {
      setUniqueLabelName(
        `${service}\t${namespace}\t${version}\t${method}\t${label}`
      );
    } else setUniqueLabelName("");
  }, [method]);
  useEffect(() => {}, [uniqueLabelName]);
  useEffect(() => {
    const url = `${namespace}${service && `\t${service}`}${
      version && `\t${version}`
    }${label && `\t${label}`}${method && `\t${method}`}`;
    const encoded = encodeURIComponent(btoa(url));
    navigate(`/interfaces${encoded && `?q=${encoded}`}`, {
      replace: true,
    });
  }, [namespace, service, version, label, method]);

  const getMenuItemLevel = (level: number) => {
    if (!labelMap) return [];
    const keys = [namespace, service, version, label, method];
    let root = labelMap;
    for (let i = 0; i < level; i++) {
      if (!root) break;
      root = root[keys[i]];
    }
    return root ? Object.keys(root) : [];
  };
  const setAndClearUpTo = (value: string, level: number) => {
    const setFunctions = [
      setNamespace,
      setService,
      setVersion,
      setLabel,
      setMethod,
    ];
    setFunctions.forEach((f, id) => {
      if (id > level) {
        f("");
      } else if (id === level) {
        f(value);
      }
    });
  };
  const selects = [
    { name: "Namespace", relVal: () => namespace },
    { name: "Service", relVal: () => service },
    { name: "Version", relVal: () => version },
    { name: "Label", relVal: () => label },
    { name: "Method", relVal: () => method },
  ];

  return (
    <Box className={classes.root}>
      <Grid container padding={1} spacing={1}>
        <Grid item xs={12}>
          <Typography variant="h5">Interfaces</Typography>
        </Grid>
        <Grid item xs={12} margin="1em 1em 0 0">
          {labelMap &&
            selects.map((s, id) => (
              <FormControl key={`select-${id}`}>
                <InputLabel id={`label-${id}`}>{s.name}</InputLabel>
                <Select
                  labelId={`label-${id}`}
                  label={s.name}
                  onChange={(e) => setAndClearUpTo(e.target.value, id)}
                  value={s.relVal()}
                  className={classes.select}
                >
                  {getMenuItemLevel(id).map((val, idx) => (
                    <MenuItem value={val} key={`${id}-${idx}`}>
                      {val}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}
        </Grid>
        {uniqueLabelName && (
          <InterfaceDisplay uniqueLabelName={uniqueLabelName} />
        )}
      </Grid>
    </Box>
  );
}
