import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Config from "../../Config";
import SwaggerUI from "swagger-ui";
import "swagger-ui/dist/swagger-ui.css";
import {
  Box,
  Button,
  Card,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from "@mui/material";
import { Download } from "@mui/icons-material";
import { makeStyles } from "@mui/styles";
import SwaggerService from "../services/SwaggerService";

const useStyles = makeStyles(() => ({
  actions: {
    height: "5em",
    display: "flex",
    flexDirection: "row",
    placeItems: "center",
    justifyContent: "center",
    gap: "1em",
    padding: "1em",
  },
}));

export default function Swagger() {
  const classes = useStyles();
  const { service } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const swaggerPrefix = `${Config.ApiHost}${Config.ApiPrefix}/swagger/`;
  const id = `swagger-${Math.floor(Math.random() * 1000)}`;
  const tag = query.get("tag");

  const [tags, setTags] = useState<string[]>([]);
  const [newVersion, setNewVersion] = useState<string>("");
  const [url, setUrl] = useState<string>(
    `${swaggerPrefix}${encodeURIComponent(service || "")}${
      tag ? `?tag=${encodeURIComponent(tag)}` : ""
    }`
  );

  useEffect(() => {
    if (service) {
      setUrl(
        `${swaggerPrefix}${encodeURIComponent(service || "")}${
          tag ? `?tag=${encodeURIComponent(tag)}` : ""
        }`
      );
      SwaggerService.getInstance().getTags(service).then(setTags);
    }
  }, [service, query]);

  useEffect(() => {
    if (service) {
      SwaggerUI({
        dom_id: `#${id}`,
        url,
      });
    }
  }, [url]);

  const download = (json = true) => {
    if (!service) return;
    const filename = `${service.replace(/\t/g, "_")}.${json ? "json" : "yaml"}`;
    const path = `${swaggerPrefix}${json ? "" : "yaml/"}${encodeURIComponent(
      service
    )}${tag ? `?tag=${encodeURIComponent(tag)}` : ""}`;
    fetch(path)
      .then((res) => res.text())
      .then((res) => {
        const content = `data:text/${
          json ? "json" : "yaml"
        };charset=utf-8,${encodeURIComponent(res)}`;
        const link = document.createElement("a");
        link.setAttribute("target", "_blank");
        link.setAttribute("download", filename);
        link.setAttribute("href", content);
        link.click();
      });
  };

  const createNewVersion = async () => {
    if (!service || !newVersion) return;
    await SwaggerService.getInstance().addTaggedSwagger({
      uniqueServiceName: service,
      tag: newVersion,
      openApiDocument: JSON.stringify(
        await fetch(url).then((res) => res.json())
      ),
    });
    setNewVersion("");
    navigate(
      `/swagger/${encodeURIComponent(service)}?tag=${encodeURIComponent(
        newVersion
      )}`
    );
  };
  const deleteVersion = async () => {
    if (!service || !tag || tag === "Latest") return;
    await SwaggerService.getInstance().deleteTaggedSwagger(service, tag);
    navigate(`/swagger/${encodeURIComponent(service)}`);
  };

  return (
    <Box>
      <Grid container padding={1} spacing={1}>
        <Grid item xs={4}>
          <Card variant="outlined" className={classes.actions}>
            <Tooltip title="Download JSON">
              <Button
                variant="contained"
                color="secondary"
                endIcon={<Download />}
                onClick={() => download()}
              >
                JSON
              </Button>
            </Tooltip>
            <Tooltip title="Download YAML">
              <Button
                variant="contained"
                color="secondary"
                endIcon={<Download />}
                onClick={() => download(false)}
              >
                YAML
              </Button>
            </Tooltip>
          </Card>
        </Grid>

        <Grid item xs={4}>
          <Card variant="outlined" className={classes.actions}>
            <TextField
              fullWidth
              label="New Version"
              variant="outlined"
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
            />
            <Tooltip title="Create a new version">
              <Button variant="contained" onClick={() => createNewVersion()}>
                Create
              </Button>
            </Tooltip>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card variant="outlined" className={classes.actions}>
            <FormControl fullWidth>
              <InputLabel id="tag-label">Selected Version</InputLabel>
              <Select
                labelId="tag-label"
                value={tag || "latest"}
                label="Selected Version"
                onChange={(e) => {
                  if (!service) return;
                  const tag =
                    e.target.value !== "latest"
                      ? `?tag=${encodeURIComponent(e.target.value)}`
                      : "";
                  navigate(`/swagger/${encodeURIComponent(service)}${tag}`);
                }}
              >
                <MenuItem value="latest">Latest</MenuItem>
                {tags.map((t, i) => (
                  <MenuItem key={`tag-${i}`} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title="Delete selected">
              <>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => deleteVersion()}
                  disabled={!tag || tag === "Latest"}
                >
                  Delete
                </Button>
              </>
            </Tooltip>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <div id={id}></div>
        </Grid>
      </Grid>
    </Box>
  );
}
