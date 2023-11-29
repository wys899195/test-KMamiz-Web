import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { EndpointRowType } from "../../pages/Endpoints";

export type TableProps = {
  namespace: string;
  service: string;
  version: string;
  rowMap?: Map<string, EndpointRowType[]>;
};

const useStyles = makeStyles(() => ({
  table: {
    height: "400px",
  },
}));
export default function LabelTable(props: TableProps) {
  const classes = useStyles();
  return (
    <TableContainer
      variant="outlined"
      component={Paper}
      className={classes.table}
    >
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Method</TableCell>
            <TableCell>Label</TableCell>
            <TableCell>Path</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(
            props.rowMap?.get(
              `${props.service}\t${props.namespace}\t${props.version}`
            ) || []
          )
            .sort((a, b) => {
              let cmp = 0;
              cmp = a.method.localeCompare(b.method);
              if (cmp !== 0) return cmp;
              cmp = a.label.localeCompare(b.label);
              if (cmp !== 0) return cmp;
              return a.path.localeCompare(b.path);
            })
            .map((r) => (
              <TableRow key={`row-${r.id}`}>
                <TableCell>{r.method}</TableCell>
                <TableCell>{r.label}</TableCell>
                <TableCell>{r.path}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
