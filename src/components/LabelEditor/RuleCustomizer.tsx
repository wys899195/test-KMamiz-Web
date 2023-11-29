import {
  Typography,
  Card,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Tooltip,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useEffect, useState } from "react";
import { TRequestTypeUpper } from "../../entities/TRequestType";
import { EndpointRowType } from "../../pages/Endpoints";
import DataService from "../../services/DataService";

type BaseProps = {
  namespace: string;
  service: string;
  version: string;
  rowMap: Map<string, EndpointRowType[]>;
  triggerUpdate: () => void;
};

const useStyles = makeStyles(() => ({
  card: {
    height: "40em",
    overflow: "auto",
    padding: "0.5em",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1em",
  },
}));
export default function RuleCustomizer(props: BaseProps) {
  const classes = useStyles();
  const [method, setMethod] = useState<TRequestTypeUpper>();
  const [usableMethod, setUsableMethod] = useState<TRequestTypeUpper[]>([]);
  const [paths, setPaths] =
    useState<{ path: string; url: string; selected: boolean }[]>();
  const [filter, setFilter] = useState<string>("");
  const [block, setBlock] = useState<boolean>(false);
  const [customLabel, setCustomLabel] = useState<string>("");

  useEffect(() => {
    const key = `${props.service}\t${props.namespace}\t${props.version}`;
    const mList = new Set<TRequestTypeUpper>();
    const pList = new Set<string>();
    props.rowMap.get(key)!.forEach((r) => {
      mList.add(r.method as TRequestTypeUpper);

      if (r.method === method) {
        pList.add(`${r.url}\t${r.path}`);
      }
    });

    setPaths(
      [...pList].map((p) => {
        const [url, path] = p.split("\t");
        return {
          url,
          path,
          selected: false,
        };
      })
    );
    setUsableMethod([...mList]);
  }, [props, method]);

  const toggleSelect = (path: {
    path: string;
    url: string;
    selected: boolean;
  }) => {
    setPaths(
      paths?.map((p) => {
        if (p.path === path.path) {
          path.selected = !path.selected;
          return path;
        }
        return p;
      })
    );
  };

  const submit = () => {
    if (customLabel && method) {
      const uniqueServiceName = `${props.service}\t${props.namespace}\t${props.version}`;
      const samples =
        paths
          ?.filter((p) => p.selected)
          .map((p) => `${uniqueServiceName}\t${method}\t${p.url}`) || [];
      DataService.getInstance()
        .updateUserDefinedLabels({
          labels: [
            {
              label: customLabel,
              method,
              block,
              uniqueServiceName,
              samples,
            },
          ],
        })
        .then(() => {
          setFilter("");
          setMethod(undefined);
          setCustomLabel("");
          setBlock(false);
          props.triggerUpdate();
        });
    }
  };

  return (
    <div className={classes.card}>
      <Typography variant="h6">Create Rule</Typography>
      <FormGroup className={classes.form}>
        <Tooltip title="Check to block an automatically generated label.">
          <FormControlLabel
            control={
              <Checkbox checked={block} onClick={() => setBlock(!block)} />
            }
            label="Block"
          />
        </Tooltip>
        <TextField
          label="Custom Label"
          value={customLabel}
          variant="outlined"
          helperText="Must starts with '/', use '{}' to indicate path variable."
          onChange={(e) => setCustomLabel(e.target.value)}
        />
        <TextField
          select
          label="Method"
          value={method || ""}
          onChange={(e) => setMethod(e.target.value as TRequestTypeUpper)}
          helperText="Choose one of the recorded methods shown above."
        >
          {usableMethod.map((t) => (
            <MenuItem value={t} key={`request-${t}`}>
              {t}
            </MenuItem>
          ))}
        </TextField>
        {!block && (
          <>
            <Typography>Sample Paths</Typography>
            <TextField
              label="Path Filter"
              variant="outlined"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <small>
              <i>Hover to see full path</i>
            </small>
            <Card variant="outlined" sx={{ height: "10em", overflow: "auto" }}>
              <List dense>
                {paths
                  ?.filter((p) => p.path.includes(filter))
                  .map((p, id) => (
                    <Tooltip key={`item-${id}`} title={p.path}>
                      <ListItem disablePadding>
                        <ListItemButton onClick={() => toggleSelect(p)}>
                          <ListItemIcon>
                            <Checkbox
                              checked={p.selected}
                              edge="start"
                              tabIndex={-1}
                              disableRipple
                            />
                          </ListItemIcon>
                          <ListItemText primary={p.path} />
                        </ListItemButton>
                      </ListItem>
                    </Tooltip>
                  ))}
              </List>
            </Card>
          </>
        )}
        <Button variant="contained" onClick={() => submit()}>
          Submit
        </Button>
      </FormGroup>
    </div>
  );
}
