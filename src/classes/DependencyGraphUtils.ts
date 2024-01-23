import { Dispatch, SetStateAction, useState } from "react";
import { TGraphData, TLink, TNode } from "../entities/TGraphData";
import { Color } from "./ColorUtils";

// to highlight node in the dependency graph
export type HighlightInfo = {
  highlightLinks: Set<any>;
  highlightNodes: Set<any>;
  focusNode: any;
};
const useHoverHighlight = (): [
  HighlightInfo,
  Dispatch<SetStateAction<HighlightInfo>>
] => {
  const [highlight, setHighlight] = useState<HighlightInfo>({
    highlightLinks: new Set<any>(),
    highlightNodes: new Set<any>(),
    focusNode: null,
  });
  return [highlight, setHighlight];
};


// to compare two dependency graphs
const state = [
  'added',
  'modified',
  'deleted'
] as const;
export type GraphDifferenceState = typeof state[number];

type NodesInfo = {
  id:string,
  name:string,
}
type NodeGroupInfo = {
  ServiceNodeState:GraphDifferenceState,
  ServiceNodeId:string, //service node id
  groupName:string, //service node name
  endPointNodes:Array<NodesInfo>
}
export type GraphDifferenceInfo = {
  addedNodes: Set<any>; // display added nodes at the dependency graph
  deletedNodes: Set<any>; // display deleted nodes at the dependency graph
  addedNodesAfterGrouping: Array<NodeGroupInfo>; // display differences in GraphDiffTabs
  deletedNodesAfterGrouping: Array<NodeGroupInfo>; // display differences in GraphDiffTabs
};
const useGraphDifference = (): [
  GraphDifferenceInfo,
  Dispatch<SetStateAction<GraphDifferenceInfo>>
] => {
  const [graphDifference, setGraphDifference] = useState<GraphDifferenceInfo>({
    addedNodes: new Set<any>(),
    deletedNodes: new Set<any>(),
    addedNodesAfterGrouping: new Array<NodeGroupInfo>(),
    deletedNodesAfterGrouping: new Array<NodeGroupInfo>(),
  });
  return [graphDifference, setGraphDifference];
};


export class DependencyGraphUtils {
  private constructor() {}

  static readonly GraphBasicSettings = {
    linkDirectionalArrowColor: () => "dimgray",
    // linkDirectionalParticles: 1,
    linkDirectionalArrowRelPos: 1,
    nodeRelSize: 4,
    // nodeAutoColorBy: "group",
    nodePointerAreaPaint: DependencyGraphUtils.PaintNode,
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
        addedNodes: new Set<any>(),
        deletedNodes: new Set<any>(),
        addedNodesAfterGrouping: new Array<NodeGroupInfo>(),
        deletedNodesAfterGrouping: new Array<NodeGroupInfo>(),
      }
    }else{
      //excluding external nodes
      const nodeIdsInLatestData: string[] = latestData.nodes.map(node => node.id).filter(id => id !== "null");
      const nodeIdsInTaggedData: string[] = taggedData.nodes.map(node => node.id).filter(id => id !== "null");
      const addedNodeIds: Set<string> = new Set(nodeIdsInLatestData.filter(id => !nodeIdsInTaggedData.includes(id)));
      const deletedNodeIds: Set<string> = new Set(nodeIdsInTaggedData.filter(id => !nodeIdsInLatestData.includes(id)));

      const addedNodes: Set<any> = new Set(latestData.nodes.filter(node => addedNodeIds.has(node.id)));
      const deletedNodes: Set<any> = new Set(taggedData.nodes.filter(node => deletedNodeIds.has(node.id)));

      const addedNodeGroupNames: Set<string> = new Set([...addedNodes].map(node => node.group));
      const deletedNodeGroupNames: Set<string> = new Set([...deletedNodes].map(node => node.group));

      const addedNodesAfterGrouping:Array<NodeGroupInfo> = [...addedNodeGroupNames]
        .map(group =>{
          const isServiceNodeInaddedNodes:boolean = 
            [...addedNodes].find(node => node.id === group) !== undefined;
          
          return {
            ServiceNodeState:isServiceNodeInaddedNodes ? 'added' : 'modified',
            ServiceNodeId:group,
            groupName:group.replace("\t", "."),
            endPointNodes:[...addedNodes]
              .filter(node => node.group === group && node.group !== node.id)
              .map(node => {
                return {
                  id:node.id,
                  name:node.name
                }
              })
          }
        }
      )
      const deletedNodesAfterGrouping:Array<NodeGroupInfo> = [...deletedNodeGroupNames]
        .map(group =>{
          const isServiceNodeIndeletedNodes:boolean = 
            [...deletedNodes].find(node => node.id === group) !== undefined;
          
          return {
            ServiceNodeState:isServiceNodeIndeletedNodes ? 'deleted' : 'modified',
            ServiceNodeId:group,
            groupName:group.replace("\t", "."),
            endPointNodes:[...deletedNodes]
              .filter(node => node.group === group && node.group !== node.id)
              .map(node => {
                return {
                  id:node.id,
                  name:node.name
                }
              })
          }
        }
      )
      console.log("addedNodesAfterGrouping")
      console.log(addedNodesAfterGrouping)
      console.log("deletedNodesAfterGrouping")
      console.log(deletedNodesAfterGrouping)
      return {
        addedNodes: addedNodes,
        deletedNodes: deletedNodes,
        addedNodesAfterGrouping: addedNodesAfterGrouping,
        deletedNodesAfterGrouping: deletedNodesAfterGrouping
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
    globalScale: number = DependencyGraphUtils.GraphBasicSettings.nodeRelSize
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
    const r = DependencyGraphUtils.GraphBasicSettings.nodeRelSize * 0.6;
    const { x, y } = node;

    ctx.beginPath();
    // paint hexagon if node is a service (group center)
    if (node.id === node.group) {
      DependencyGraphUtils.DrawHexagon(x, y, r, ctx);
    } else {
      ctx.arc(
        x,
        y,
        DependencyGraphUtils.GraphBasicSettings.nodeRelSize,
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

    DependencyGraphUtils.DrawText(
      label,
      Color.fromHex(color)!.decideForeground()!.hex,
      node,
      ctx
    );
    if (label !== "EP") {
      DependencyGraphUtils.DrawText(node.name, "#000", node, ctx, 1.5);
    } else {
      let path = node.name;
      if (node.name.length > 30)
        path =
          path.substring(0, 15) + " ... " + path.substring(path.length - 15);
      DependencyGraphUtils.DrawText(path, "#000", node, ctx, 1.5);
    }
  }

  static PaintNodeRing(
    node: any,
    ctx: CanvasRenderingContext2D,
    highlight: boolean,
    focusNode: any
  ) {
    // add ring just for highlighted nodes
    if (highlight) {
      ctx.fillStyle = node === focusNode ? "navy" : "orange";
      const { x, y } = node;
      ctx.beginPath();
      if (node.id === node.group) {
        const r = DependencyGraphUtils.GraphBasicSettings.nodeRelSize * 0.85;
        DependencyGraphUtils.DrawHexagon(x, y, r, ctx);
      } else {
        ctx.arc(
          x,
          y,
          DependencyGraphUtils.GraphBasicSettings.nodeRelSize * 1.4,
          0,
          2 * Math.PI,
          false
        );
      }
      ctx.fill();
    }

    // paint underlying style on top of ring
    const color = Color.generateFromString(node.group);
    DependencyGraphUtils.PaintNode(node, color.hex, ctx);
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
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
      }
      else if(isDeletedNode){
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      }
      const { x, y } = node;
      ctx.beginPath();
      if (node.id === node.group) {
        const r = DependencyGraphUtils.GraphBasicSettings.nodeRelSize * 1.10;
        DependencyGraphUtils.DrawHexagon(x, y, r, ctx);
      } else {
        ctx.arc(
          x,
          y,
          DependencyGraphUtils.GraphBasicSettings.nodeRelSize * 1.9,
          0,
          2 * Math.PI,
          false
        );
      }
      ctx.fill();
    }

    // paint underlying style on top of ring
    const color = Color.generateFromString(node.group);
    DependencyGraphUtils.PaintNode(node, color.hex, ctx);
  }

  static ZoomOnClick(node: any, graphRef: any) {
    if (!graphRef.current) return;
    graphRef.current.centerAt(node.x, node.y, 800);
    graphRef.current.zoom(4, 1000);
  }
}

export { useHoverHighlight };

export { useGraphDifference };
