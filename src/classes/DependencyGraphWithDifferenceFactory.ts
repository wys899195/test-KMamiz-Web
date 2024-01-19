import { DependencyGraphWithDifferenceUtils, GraphDifferenceInfo } from "./DependencyGraphWithDifferenceUtils";

export class DependencyGraphWithDifferenceFactory {
  private constructor() {}

  static Create(
    showDifference:boolean,
    graphDifferenceInfo: GraphDifferenceInfo,
  ) {
    const { addedNodeIds, deletedNodeIds } = graphDifferenceInfo;
    return {
      ...DependencyGraphWithDifferenceUtils.GraphBasicSettings,
      linkDirectionalArrowLength: (link: any) =>
        3,
      linkWidth: (link: any) => 
        1,
      linkDirectionalParticleWidth: (link: any) =>
        4,
      nodeCanvasObject: (node: any, ctx: any) =>
        DependencyGraphWithDifferenceUtils.PaintNodeRingForShowDifference(
          showDifference,
          node,
          ctx,
          addedNodeIds.has(node.id),
          deletedNodeIds.has(node.id)
        ),
      onNodeClick: (node: any) => {},
      onNodeHover: (node: any) => {},
      onLinkClick: (link: any) => {},
      onLinkHover: (link: any) => {},
    };
  }
}
