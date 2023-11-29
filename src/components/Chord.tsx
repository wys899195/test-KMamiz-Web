import { makeStyles } from "@mui/styles";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { percent, Root } from "@amcharts/amcharts5";
import { ChordDirected } from "@amcharts/amcharts5/flow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import ViewportUtils from "../classes/ViewportUtils";
import ChordUtils from "../classes/ChordUtils";
import { Button, Card } from "@mui/material";
import { TChordData } from "../entities/TChordData";

const useStyles = makeStyles(() => ({
  root: {
    textAlign: "center",
  },
  chart: {
    width: "100%",
  },
  reset: {
    zIndex: "10",
    position: "absolute",
    display: "flex",
    transform: "translateX(50vw) translateX(-10em) translateY(-38px)",
    gap: "0.3em",
  },
}));

export type ChordDiagramOptions = {
  title: string;
  chordData: TChordData;
  hideControls?: boolean;
};

export default function Chord(props: ChordDiagramOptions) {
  const classes = useStyles();
  const cordRef = useRef<ChordDirected | null>(null);
  const canvasRootRef = useRef<HTMLDivElement | null>(null);
  const [divId] = useState(`id-${Math.random()}`);
  const [size, setSize] = useState(0);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    // register to viewport resize
    const unsubscribe = ViewportUtils.getInstance().subscribe(([vw]) =>
      setSize(vw / 3)
    );

    // create the chord diagram
    const root = Root.new(divId);
    root.setThemes([am5themes_Animated.new(root)]);
    cordRef.current = ChordUtils.CreateDefault(root, !props.hideControls);
    ChordUtils.FillData(
      root,
      cordRef.current!,
      props.chordData.links,
      props.chordData.nodes
    );

    // teardown
    return () => {
      unsubscribe();
      root.dispose();
    };
  }, [props.chordData]);

  useEffect(() => {
    cordRef.current?.set("scale", scale);
  }, [scale]);

  return (
    <div className={classes.root}>
      <h3>{props.title}</h3>
      <Card variant="outlined">
        <div
          id={divId}
          ref={canvasRootRef}
          className={classes.chart}
          style={{ height: size }}
          onWheel={(e) => {
            if (props.hideControls) return false;
            if (e.shiftKey) {
              const newScale = scale + (e.deltaY > 0 ? 0.2 : -0.2);
              /**
               * Make sure scale is always greater than 0
               * Since `scale = 0` makes the diagram disappear,
               * and a negative scale value mirrors the diagram.
               */
              if (newScale > 0.1) setScale(newScale);

              e.preventDefault();
              e.stopPropagation();
              return false;
            }
            return true;
          }}
          onContextMenu={(e) => {
            if (props.hideControls) return true;
            e.preventDefault();
            return false;
          }}
        ></div>
      </Card>
      {!props.hideControls && (
        <div className={classes.reset}>
          <Button
            variant="contained"
            size="small"
            color="primary"
            onClick={() => {
              const dataUrl = canvasRootRef.current
                ?.querySelector("canvas")
                ?.toDataURL("image/png");
              if (dataUrl) {
                const link = document.createElement("a");
                link.setAttribute("download", `${props.title}.png`);
                link.setAttribute("href", dataUrl);
                link.click();
              }
            }}
          >
            Save
          </Button>
          <Button
            variant="contained"
            size="small"
            color="warning"
            onClick={() => {
              cordRef.current?.set("x", percent(50));
              cordRef.current?.set("y", percent(50));
              cordRef.current?.set("startAngle", 80);
              setScale(1);
            }}
          >
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}
