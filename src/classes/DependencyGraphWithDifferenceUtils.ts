import { Dispatch, SetStateAction, useState } from "react";
import { TGraphData, TLink, TNode } from "../entities/TGraphData";
import { Color } from "./ColorUtils";

export type GraphDifferenceInfo = {
  addedNodeIds: Set<string>;
  deletedNodeIds: Set<string>;
};

const useGraphDifference = (): [
  GraphDifferenceInfo,
  Dispatch<SetStateAction<GraphDifferenceInfo>>
] => {
  const [graphDifference, setGraphDifference] = useState<GraphDifferenceInfo>({
    addedNodeIds: new Set<string>(),
    deletedNodeIds: new Set<string>(),
  });
  return [graphDifference, setGraphDifference];
};

export class DependencyGraphWithDifferenceUtils {
  private constructor() {}

  static readonly GraphBasicSettings = {
    linkDirectionalArrowColor: () => "dimgray",
    // linkDirectionalParticles: 1,
    linkDirectionalArrowRelPos: 1,
    nodeRelSize: 4,
    // nodeAutoColorBy: "group",
    nodePointerAreaPaint: DependencyGraphWithDifferenceUtils.PaintNode,
    linkLabel: (d: any) => `${d.source.name} ➔ ${d.target.name}`,
  };

  static ProcessData(data: TGraphData) {
    const graphData: {
      nodes: (TNode & { highlight: TNode[]; links: TLink[] })[];
      links: TLink[];
    } = {
      nodes: data.nodes.map((n) => ({
        ...n,
        highlight: [],
        links: [],
      })),
      links: data.links,
    };

    graphData.nodes.forEach((node) => {
      node.highlight = node.dependencies.map(
        (d) => graphData.nodes.find((n) => n.id === d)!
      );
      node.linkInBetween.forEach(({ source, target }) => {
        const link = graphData.links.find(
          (l) => l.source === source && l.target === target
        );
        if (link) node.links.push(link);
      });
    });
    return graphData;
  }

  static CompareTwoGraphData(latestData:TGraphData,taggedData:TGraphData):GraphDifferenceInfo{
    if (!latestData || !taggedData){
      return {
        addedNodeIds: new Set<string>(),
        deletedNodeIds: new Set<string>(),
      }
    }else{
      const nodeIdsInLatestData: Set<string> = new Set(latestData.nodes.map(node => node.id));
      const nodeIdsInTaggedData: Set<string> = new Set(taggedData.nodes.map(node => node.id));
      return {
        addedNodeIds: new Set([...nodeIdsInTaggedData].filter(id => !nodeIdsInLatestData.has(id))),
        deletedNodeIds: new Set([...nodeIdsInLatestData].filter(id => !nodeIdsInTaggedData.has(id))),
      }
    }
  }

  static DrawHexagon(x: any, y: any, r: number, ctx: CanvasRenderingContext2D) {
    ctx.moveTo(x, y + 2 * r);
    ctx.lineTo(x + Math.sqrt(3) * r, y + r);
    ctx.lineTo(x + Math.sqrt(3) * r, y - r);
    ctx.lineTo(x, y - 2 * r);
    ctx.lineTo(x - Math.sqrt(3) * r, y - r);
    ctx.lineTo(x - Math.sqrt(3) * r, y + r);
    ctx.closePath();
  }

  static DrawText(
    text: string,
    color: string,
    node: any,
    ctx: CanvasRenderingContext2D,
    offsetUnitY: number = 0,
    globalScale: number = DependencyGraphWithDifferenceUtils.GraphBasicSettings.nodeRelSize
  ) {
    const label = text;
    const fontSize = 12 / globalScale;

    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(label, node.x, node.y + offsetUnitY * globalScale);
  }

  static PaintNode(node: any, color: string, ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = color;
    const r = DependencyGraphWithDifferenceUtils.GraphBasicSettings.nodeRelSize * 0.6;
    const { x, y } = node;

    ctx.beginPath();
    // paint hexagon if node is a service (group center)
    if (node.id === node.group) {
      DependencyGraphWithDifferenceUtils.DrawHexagon(x, y, r, ctx);
    } else {
      ctx.arc(
        x,
        y,
        DependencyGraphWithDifferenceUtils.GraphBasicSettings.nodeRelSize,
        0,
        2 * Math.PI,
        false
      );
    }
    ctx.fill();

    let label = "";
    if (node.id === "null") {
      label = "EX";
    } else if (node.id === node.group) {
      label = "SRV";
    } else {
      label = "EP";
    }

    DependencyGraphWithDifferenceUtils.DrawText(
      label,
      Color.fromHex(color)!.decideForeground()!.hex,
      node,
      ctx
    );
    if (label !== "EP") {
      DependencyGraphWithDifferenceUtils.DrawText(node.name, "#000", node, ctx, 1.5);
    } else {
      let path = node.name;
      if (node.name.length > 30)
        path =
          path.substring(0, 15) + " ... " + path.substring(path.length - 15);
      DependencyGraphWithDifferenceUtils.DrawText(path, "#000", node, ctx, 1.5);
    }
  }

  static PaintNodeRingForShowDifference(
    showDifference: boolean,
    node: any,
    ctx: CanvasRenderingContext2D,
    isAddedNode: boolean,
    isDeletedNode: boolean
  ) {
    // add ring just for difference nodes
    if (!showDifference || isAddedNode && isDeletedNode){
      // do nothing
    }
    else if(isAddedNode || isDeletedNode){
      if (isAddedNode){
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      }
      else if(isDeletedNode){
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
      }
      const { x, y } = node;
      ctx.beginPath();
      if (node.id === node.group) {
        const r = DependencyGraphWithDifferenceUtils.GraphBasicSettings.nodeRelSize * 1.10;
        DependencyGraphWithDifferenceUtils.DrawHexagon(x, y, r, ctx);
      } else {
        ctx.arc(
          x,
          y,
          DependencyGraphWithDifferenceUtils.GraphBasicSettings.nodeRelSize * 1.9,
          0,
          2 * Math.PI,
          false
        );
      }
      ctx.fill();
    }

    // paint underlying style on top of ring
    const color = Color.generateFromString(node.group);
    DependencyGraphWithDifferenceUtils.PaintNode(node, color.hex, ctx);
  }


  static ZoomOnClick(node: any, graphRef: any) {
    if (!graphRef.current) return;
    graphRef.current.centerAt(node.x, node.y, 800);
    graphRef.current.zoom(4, 1000);
  }
}

export { useGraphDifference };
