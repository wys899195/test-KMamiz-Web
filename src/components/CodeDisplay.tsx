import { makeStyles } from "@mui/styles";
import hljs from "highlight.js";
import { useMemo } from "react";

export type CodeDisplayProps = {
  code: string;
};

const useStyles = makeStyles(() => ({
  code: {
    borderRadius: "0.3em",
    border: "1px solid lightgray",
  },
  codeWrap: {
    margin: "0",
    overflow: "auto",
  },
  codeBlock: {
    display: "inline-block",
    padding: "0.5em 1em",
  },
}));
export default function CodeDisplay(props: CodeDisplayProps) {
  const classes = useStyles();
  const code = useMemo(
    () => hljs.highlight(props.code, { language: "typescript" }).value || "",
    [props.code]
  );
  return (
    <div className={classes.code}>
      <pre className={classes.codeWrap}>
        <code
          className={`${classes.codeBlock} language-typescript`}
          dangerouslySetInnerHTML={{
            __html: code,
          }}
        ></code>
      </pre>
    </div>
  );
}
