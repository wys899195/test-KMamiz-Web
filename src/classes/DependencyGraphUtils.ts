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
  'deleted',
  'unchanged'
] as const;
export type GraphDifferenceState = typeof state[number];

const relasionShip = [
  'direct dependency',
  'indirect dependency',
  'only one matching service',
  'no matching services in graph',
] as const;
export type ServicvePairRelasionShip = typeof relasionShip[number];

type DiffBetweenTwoServiceNodes = {
  serviceIdPair: [string,string];
  serviceStatePair: [GraphDifferenceState,GraphDifferenceState];
  addedNodeIds: string[];
  deletedNodeIds: string[];
  addedLinkIds: string[];
  deletedLinkIds: string[];
}

export type GraphDifferenceInfo = {
  // display at the Overview area
  addedNodeIds: string[]; 
  deletedNodeIds: string[];
  addedLinkIds: string[]; 
  deletedLinkIds: string[];

  // display at the Diff Details (between each pair of services) area
  allServiceNodeIds: string[];
  diffsBetweenTwoServices: DiffBetweenTwoServiceNodes[]; 
};

const useGraphDifference = (): [
  GraphDifferenceInfo,
  Dispatch<SetStateAction<GraphDifferenceInfo>>
] => {
  const [graphDifference, setGraphDifference] = useState<GraphDifferenceInfo>({
    addedNodeIds: [],
    deletedNodeIds: [],
    addedLinkIds: [],
    deletedLinkIds: [],
    allServiceNodeIds: [],
    diffsBetweenTwoServices: [],
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

  static TLinkToId(link:TLink):string {
    return `${link.source}==>${link.target}`
  }

  static CompareTwoGraphData(latestData:TGraphData,taggedData:TGraphData):GraphDifferenceInfo{
    if (!latestData || !taggedData){
      return {
        addedNodeIds: [],
        deletedNodeIds: [],
        addedLinkIds: [],
        deletedLinkIds: [],
        allServiceNodeIds: [],
        diffsBetweenTwoServices: [],
      }
    }else{
      // ids of all nodes
      const nodeIdsInLatestData: string[] = latestData.nodes.map(node => node.id)
      const nodeIdsInTaggedData: string[] = taggedData.nodes.map(node => node.id);
      const addedNodeIds: Set<string> = new Set(nodeIdsInLatestData.filter(id => !nodeIdsInTaggedData.includes(id)));
      const deletedNodeIds: Set<string> = new Set(nodeIdsInTaggedData.filter(id => !nodeIdsInLatestData.includes(id)));
      const addedNodes: Set<any> = new Set(latestData.nodes.filter(node => addedNodeIds.has(node.id)));
      const deletedNodes: Set<any> = new Set(taggedData.nodes.filter(node => deletedNodeIds.has(node.id)));

      // ids of all links excluding external nodes
      const linkIdsInLatestData: string[] = latestData.links.map(link => this.TLinkToId(link));
      const linkIdsInTaggedData: string[] = taggedData.links.map(link => this.TLinkToId(link));
      const addedLinkIds: Set<string> = new Set(linkIdsInLatestData.filter(id => !linkIdsInTaggedData.includes(id)));
      const deletedLinkIds: Set<string> = new Set(linkIdsInTaggedData.filter(id => !linkIdsInLatestData.includes(id)));

      // ids of service nodes (including external node)
      const allServiceNodeIds: string[] = 
      Array.from(
        new Set(
          [...latestData.nodes,...taggedData.nodes]
            .filter(node => node.id === node.group)
            .map(node => node.id)
        )
      );

      // At least two services are required for show diff between two services
      if(allServiceNodeIds.length <= 2){
        return {
          addedNodeIds: Array.from(addedNodeIds),
          deletedNodeIds: Array.from(deletedNodeIds),
          addedLinkIds: Array.from(addedLinkIds),
          deletedLinkIds: Array.from(deletedLinkIds),
          allServiceNodeIds: allServiceNodeIds.filter(id => id !== 'null'),
          diffsBetweenTwoServices: new Array<DiffBetweenTwoServiceNodes>(),
        }
      }
      const addedServiceNodeIds: string[] = 
        Array.from(
          new Set(
            [...addedNodeIds].filter(id => allServiceNodeIds.includes(id))
          )
        );
      const deletedServiceNodeIds: string[] =
        Array.from(
          new Set(
            [...deletedNodeIds].filter(id => allServiceNodeIds.includes(id))
          )
        );
      const overlappingServiceNodeIds: string[] =
        Array.from(
          new Set(
            [...allServiceNodeIds].filter(id => !addedNodeIds.has(id) && !deletedNodeIds.has(id))
          )
        );

      const diffDetails:Array<DiffBetweenTwoServiceNodes> = []
      
      for (let i = 0; i < allServiceNodeIds.length - 1; i++) {
        for (let j = i + 1; j < allServiceNodeIds.length; j++) {
          const serviceIdPair: [string,string] = [
            allServiceNodeIds[i],allServiceNodeIds[j]
          ]
          const serviceStatePair:[GraphDifferenceState,GraphDifferenceState] = [
            addedServiceNodeIds.includes(allServiceNodeIds[i]) ? "added"
                  : deletedServiceNodeIds.includes(allServiceNodeIds[i]) ? "deleted" 
                  : overlappingServiceNodeIds.includes(allServiceNodeIds[i]) ? "modified" : "unchanged",
            addedServiceNodeIds.includes(allServiceNodeIds[j]) ? "added"
                  : deletedServiceNodeIds.includes(allServiceNodeIds[j]) ? "deleted" 
                  : overlappingServiceNodeIds.includes(allServiceNodeIds[j]) ? "modified" : "unchanged"
          ]
          const addedNodeIdsBetweenTwoServices:string[] = 
            [...addedNodes]
              .filter(node => node.group === allServiceNodeIds[i] || node.group === allServiceNodeIds[j])
              .map(node => node.id)
          const deletedNodeIdsBetweenTwoServices:string[] = 
            [...deletedNodes]
              .filter(node => node.group === allServiceNodeIds[i] || node.group === allServiceNodeIds[j])
              .map(node => node.id)
          const addedLinkIdsBetweenTwoServices:string[] = 
            [...addedLinkIds]
              .filter(linkId => 
                linkId.includes(allServiceNodeIds[i]) && linkId.includes(allServiceNodeIds[j])
                || linkId.includes(allServiceNodeIds[i]) && linkId.includes(allServiceNodeIds[i])
                || linkId.includes(allServiceNodeIds[j]) && linkId.includes(allServiceNodeIds[j])
              )
          const deletedLinkIdsBetweenTwoServices:string[] = 
            [...deletedLinkIds]
              .filter(linkId => 
                linkId.includes(allServiceNodeIds[i]) && linkId.includes(allServiceNodeIds[j])
                || linkId.includes(allServiceNodeIds[i]) && linkId.includes(allServiceNodeIds[i])
                || linkId.includes(allServiceNodeIds[j]) && linkId.includes(allServiceNodeIds[j])
              )

          // filter out two services that are not directly dependent
          if (addedLinkIdsBetweenTwoServices.length !== 0 || deletedLinkIdsBetweenTwoServices.length !== 0){
            diffDetails.push({
              serviceIdPair:serviceIdPair,
              serviceStatePair:serviceStatePair,
              addedNodeIds:addedNodeIdsBetweenTwoServices,
              deletedNodeIds:deletedNodeIdsBetweenTwoServices,
              addedLinkIds:addedLinkIdsBetweenTwoServices,
              deletedLinkIds:deletedLinkIdsBetweenTwoServices,
            })
          }
        }
      }

      return {
        addedNodeIds: Array.from(addedNodeIds),
        deletedNodeIds: Array.from(deletedNodeIds),
        addedLinkIds: Array.from(addedLinkIds),
        deletedLinkIds: Array.from(deletedLinkIds),
        allServiceNodeIds: allServiceNodeIds.filter(id => id !== 'null'),
        diffsBetweenTwoServices: diffDetails,
      }
    }
  }

  static toDetailsBetweenTwoServicesGraph(graphData:TGraphData,firstServiceNodeId:string,secondServiceNodeId:string):{
    graph:TGraphData,
    relationship:ServicvePairRelasionShip, // relationship between the two services
  }{
    if (firstServiceNodeId  && secondServiceNodeId && firstServiceNodeId  != secondServiceNodeId) {
      const FilteredLinks: Array<TLink> = 
      graphData.links.filter(link =>
        link.source.includes(firstServiceNodeId) && link.target.includes(secondServiceNodeId)
        || link.source.includes(secondServiceNodeId) && link.target.includes(firstServiceNodeId)
        || link.source.includes(firstServiceNodeId) && link.target.includes(firstServiceNodeId)
        || link.source.includes(secondServiceNodeId) && link.target.includes(secondServiceNodeId)
      );
      
      const FilteredNodes: Array<TNode> = 
        graphData.nodes
          .filter(node => node.group === firstServiceNodeId || node.group === secondServiceNodeId);

      FilteredNodes.forEach((n) => {
        n.linkInBetween = FilteredLinks.filter((l) => l.source === n.id);
        n.dependencies = n.linkInBetween.map((l) => l.target);
      });

      const FilteredGraphData = {
        nodes:FilteredNodes,
        links:FilteredLinks,  
      }

      let relationship:ServicvePairRelasionShip;

      const isFirstSVCExist:boolean = FilteredNodes.find(node => node.id === firstServiceNodeId) ? true : false;
      const isSecondSVCExist:boolean = FilteredNodes.find(node => node.id === secondServiceNodeId) ? true : false;

      if (isFirstSVCExist || isSecondSVCExist){
        if (isFirstSVCExist && isSecondSVCExist){
          relationship = FilteredLinks.find(link =>         
            link.source.includes(firstServiceNodeId) && link.target.includes(secondServiceNodeId)
            || link.source.includes(secondServiceNodeId) && link.target.includes(firstServiceNodeId))
          ? 'direct dependency' : 'indirect dependency';
  
          if (relationship === 'indirect dependency') {
            /* add an invisible line between the two indirectly dependent service nodes 
            to prevent them from spreading too far apart and exceeding the canvas */
            FilteredLinks.push({source:firstServiceNodeId,target:secondServiceNodeId})
          }
        }
        else{
          relationship = 'only one matching service'
        }
      }
      else {
        relationship = 'no matching services in graph'
      }



      return {
        graph:FilteredGraphData,
        relationship:relationship
      };
    }
    else{
      return {
        graph:{
          nodes:[],
          links:[],
        },
        relationship:'no matching services in graph'
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
    node: any,
    ctx: CanvasRenderingContext2D,
    isAddedNode: boolean,
    isDeletedNode: boolean
  ) {
    // add ring just for difference nodes
    if (isAddedNode && isDeletedNode){
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
        const r = DependencyGraphUtils.GraphBasicSettings.nodeRelSize * 1;
        DependencyGraphUtils.DrawHexagon(x, y, r, ctx);
      } else {
        ctx.arc(
          x,
          y,
          DependencyGraphUtils.GraphBasicSettings.nodeRelSize * 1.65,
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
