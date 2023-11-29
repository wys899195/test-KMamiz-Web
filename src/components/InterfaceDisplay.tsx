import {
  Button,
  Card,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import {
  ChangeEvent,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { TTaggedInterface } from "../entities/TTaggedInterface";
import DataService from "../services/DataService";
import Loading from "./Loading";

const CodeDisplay = lazy(() => import("./CodeDisplay"));
const DiffDisplay = lazy(() => import("./DiffDisplay"));

type InterfaceDisplayProps = {
  uniqueLabelName: string;
};
type SchemaItem = { req: string; res: string; id: number; bounded?: boolean };

const useStyles = makeStyles(() => ({
  grid: {
    height: "30em",
    overflow: "auto",
  },
  radio: {
    padding: "0 0.5em",
    marginTop: "0.77em",
    height: "7em",
    overflow: "auto",
  },
  action: {
    marginTop: "0.1em",
    height: "10em",
    display: "flex",
    flexDirection: "column",
    gap: "1em",
  },
  select: {
    marginTop: "1em",
  },
}));
export default function InterfaceDisplay(props: InterfaceDisplayProps) {
  if (!props.uniqueLabelName) return <></>;
  const classes = useStyles();
  const [existing, setExisting] =
    useState<{ req?: string; res?: string; time: Date }[]>();
  const [tagged, setTagged] = useState<TTaggedInterface[]>();
  const [selected, setSelected] = useState<SchemaItem>();
  const [addable, setAddable] = useState<boolean>();
  const [deleteAble, setDeleteAble] = useState<boolean>();
  const [userLabel, setUserLabel] = useState<string>("");
  const [firstCmp, setFirstCmp] = useState<string>("");
  const [secondCmp, setSecondCmp] = useState<string>("");
  const [firstSchema, setFirstSchema] = useState<string>("");
  const [secondSchema, setSecondSchema] = useState<string>("");

  const compares = [
    {
      name: "First",
      val: () => firstCmp,
      setFunc: (l: string) => {
        setFirstCmp(l);
        setFirstSchema(getSchemaFromLabel(l));
      },
    },
    {
      name: "Second",
      val: () => secondCmp,
      setFunc: (l: string) => {
        setSecondCmp(l);
        setSecondSchema(getSchemaFromLabel(l));
      },
    },
  ];

  const loadData = () => {
    DataService.getInstance()
      .getEndpointDataType(props.uniqueLabelName)
      .then((res) => {
        if (!res) return;
        const map = new Map<
          string,
          { req?: string; res?: string; time: Date }
        >();
        res.schemas
          .map((s) => ({ ...s, time: new Date(s.time) }))
          .forEach((s) =>
            map.set(`${s.requestSchema || ""}\t${s.responseSchema || ""}`, {
              req: s.requestSchema,
              res: s.responseSchema,
              time: s.time,
            })
          );
        setExisting(
          [...map.values()].sort((a, b) => b.time.getTime() - a.time.getTime())
        );
      });
    DataService.getInstance()
      .getTaggedInterface(props.uniqueLabelName)
      .then(setTagged);
  };

  const allSchema = useMemo(() => {
    return (
      tagged?.map((t) => ({
        req: t.requestSchema,
        res: t.responseSchema,
        name: t.userLabel,
      })) || []
    ).concat(
      existing?.map((e, id) => ({
        req: e.req || "",
        res: e.res || "",
        name: `${
          id === 0 ? "Latest" : e.time.toLocaleString()
        } - (Auto: ${id})`,
      })) || []
    );
  }, [tagged, existing]);

  useEffect(() => loadData(), [props]);

  const handleSelectionChange = (e: ChangeEvent<any>) => {
    const idx = parseInt(e.target.value);
    let nextAddable = false;
    let nextDeleteAble = false;

    if (existing && idx < existing.length) {
      setSelected({
        req: existing[idx].req || "",
        res: existing[idx].res || "",
        id: idx,
      });
      nextAddable = true;
    } else if (tagged && existing && idx - existing.length < tagged.length) {
      const id = idx - existing.length;
      setSelected({
        req: tagged[id].requestSchema,
        res: tagged[id].responseSchema,
        id: idx - existing.length,
        bounded: tagged[id].boundToSwagger,
      });
      nextDeleteAble = true;
    }

    setAddable(nextAddable);
    setDeleteAble(nextDeleteAble);
  };

  const addTag = () => {
    if (!selected) return;
    DataService.getInstance()
      .addTaggedInterface({
        requestSchema: selected.req,
        responseSchema: selected.res,
        uniqueLabelName: props.uniqueLabelName,
        userLabel,
      })
      .then(() => loadData());
  };

  const deleteTag = () => {
    if (!selected || !tagged) return;
    DataService.getInstance()
      .deleteTaggedInterface(tagged[selected.id])
      .then(() => loadData());
  };

  const getLabelName = () => {
    const split = props.uniqueLabelName.split("\t");
    return split[split.length - 1];
  };

  const getSchemaFromLabel = (label: string) => {
    const schema = allSchema.find((s) => s.name === label);
    return `${schema!.req}\n\n${schema!.res}`;
  };

  return (
    <>
      <Grid item xs={12}>
        <Divider />
      </Grid>

      <Grid item xs={4}>
        <div className={classes.grid}>
          <RadioGroup
            radioGroup="schemas"
            name="schemas"
            onChange={handleSelectionChange}
          >
            <Typography variant="h6">Schemas</Typography>
            <Card variant="outlined" className={classes.radio}>
              <FormControl>
                {existing?.map((s, id) => (
                  <Tooltip
                    placement="right"
                    key={`label-${id}`}
                    title={`Created at: ${s.time.toLocaleString()}`}
                  >
                    <FormControlLabel
                      value={id}
                      control={<Radio />}
                      label={`${
                        id === 0 ? "Latest" : s.time.toLocaleString()
                      } - (Auto: ${id})`}
                    />
                  </Tooltip>
                ))}
              </FormControl>
            </Card>

            <Typography variant="h6">Tags</Typography>
            <Card variant="outlined" className={classes.radio}>
              <FormControl>
                {existing &&
                  tagged?.map((t, id) => (
                    <Tooltip
                      placement="right"
                      key={`label-${existing.length + id}`}
                      title={`Created at: ${new Date(
                        t.timestamp!
                      ).toLocaleString()}`}
                    >
                      <FormControlLabel
                        value={`${existing.length + id}`}
                        control={<Radio />}
                        label={t.userLabel}
                      />
                    </Tooltip>
                  ))}
              </FormControl>
            </Card>
          </RadioGroup>

          {(addable || deleteAble) && (
            <div className={classes.action}>
              <Typography variant="h6">
                {addable ? "Create a tag from schema" : "Delete a selected tag"}
              </Typography>
              {addable && (
                <TextField
                  label="Tag Name"
                  value={userLabel}
                  onChange={(e) => setUserLabel(e.target.value)}
                />
              )}
              <Button
                variant="contained"
                color={addable ? "primary" : "error"}
                onClick={() => (addable ? addTag() : deleteTag())}
                disabled={deleteAble && selected?.bounded}
              >
                {addable ? "Add" : "Delete"}
              </Button>
            </div>
          )}
        </div>
      </Grid>

      <Grid item xs={4}>
        <Typography variant="h6">Request Schema</Typography>
        <div className={classes.grid}>
          <Suspense fallback={<Loading />}>
            {selected?.req && <CodeDisplay code={selected.req} />}
          </Suspense>
        </div>
      </Grid>
      <Grid item xs={4}>
        <Typography variant="h6">Response Schema</Typography>
        <div className={classes.grid}>
          <Suspense fallback={<Loading />}>
            {selected?.res && <CodeDisplay code={selected.res} />}
          </Suspense>
        </div>
      </Grid>

      <Grid item xs={12}>
        <Divider />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="h6">Select to compare</Typography>
      </Grid>
      {compares.map((c) => (
        <Grid item xs={6} key={c.name}>
          <FormControl fullWidth className={classes.select}>
            <InputLabel id={`${c.name}-label`}>{c.name} Schema</InputLabel>
            <Select
              labelId={`${c.name}-label`}
              label={`${c.name} Schema`}
              onChange={(e) => c.setFunc(e.target.value)}
              value={c.val()}
            >
              {allSchema.map((s, id) => (
                <MenuItem key={`${c.name}-${id}`} value={s.name}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      ))}

      <Grid item xs={12}>
        <Suspense fallback={<Loading />}>
          {firstSchema && secondSchema && (
            <DiffDisplay
              name={getLabelName()}
              oldStr={firstSchema}
              newStr={secondSchema}
            />
          )}
        </Suspense>
      </Grid>
    </>
  );
}
