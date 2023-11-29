import { color, percent, Rectangle, Root } from "@amcharts/amcharts5";
import { ChordDirected } from "@amcharts/amcharts5/flow";
import { TChordNode, TChordRadius } from "../entities/TChordData";

export default class ChordUtils {
  static CreateDefault(root: Root, draggable = true) {
    return ChordDirected.new(root, {
      startAngle: 80,
      padAngle: 2,
      sourceIdField: "from",
      targetIdField: "to",
      valueField: "value",
      paddingTop: 20,
      paddingBottom: 20,
      draggable,
      centerX: percent(50),
      centerY: percent(50),
      x: percent(50),
      y: percent(50),
      scale: 1,
    });
  }

  static FillData(
    root: Root,
    chord: ChordDirected,
    links: TChordRadius[],
    nodes?: TChordNode[]
  ) {
    const series = root.container.children.push(chord);

    root.container.setAll({
      x: percent(50),
      y: percent(50),
      centerX: percent(50),
      centerY: percent(50),
    });

    chord.set(
      "background",
      Rectangle.new(root, {
        fill: color("#fcfcff"),
      })
    );

    series.nodes.labels.template.setAll({
      textType: "adjusted",
      centerX: 0,
      fontSize: 12,
    });
    series.links.template.set("fillStyle", "source");

    if (nodes) {
      series.nodes.data.setAll(
        nodes.map((n) => ({ ...n, fill: color(n.fill) }))
      );
    }
    series.data.setAll(links);
  }
}
