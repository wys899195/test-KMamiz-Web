import { CircularProgress } from "@mui/material";
import { makeStyles } from "@mui/styles";
const useStyles = makeStyles(() => ({
  root: {
    position: "absolute",
    top: "50vh",
    left: "50vw",
    transform: "translate(-50%, -50%)",
    display: "flex",
    placeItems: "center",
    justifyContent: "center",
    zIndex: "9999",
  },
  spin: {
    width: "8em !important",
    height: "8em !important",
  },
}));

export default function Loading() {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <CircularProgress className={classes.spin} />
    </div>
  );
}
