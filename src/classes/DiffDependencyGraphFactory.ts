import { DependencyGraphUtils, GraphDifferenceInfo } from "./DependencyGraphUtils";

export class DiffDependencyGraphFactory {
  private constructor() {}

  static Create(
    graphDifferenceInfo: GraphDifferenceInfo,
  ) {
    const { addedNodeIds,deletedNodeIds,addedLinkIds,deletedLinkIds } = graphDifferenceInfo;
    return {
      ...DependencyGraphUtils.GraphBasicSettings,
      linkDirectionalArrowLength: (link: any) =>
        addedLinkIds.includes(DependencyGraphUtils.TLinkToId({source:link.source.id,target:link.target.id})) 
        || deletedLinkIds.includes(DependencyGraphUtils.TLinkToId({source:link.source.id,target:link.target.id}))
        ? 6 : 3,
      linkWidth: (link: any) => 
        addedLinkIds.includes(DependencyGraphUtils.TLinkToId({source:link.source.id,target:link.target.id})) 
        || deletedLinkIds.includes(DependencyGraphUtils.TLinkToId({source:link.source.id,target:link.target.id}))
        ? 4 : 1,
      linkDirectionalParticleWidth: (link: any) =>
        4,
      linkColor: (link: any) => {
        if (addedLinkIds.includes(DependencyGraphUtils.TLinkToId({source:link.source.id,target:link.target.id}))){
          return 'rgba(0, 255, 0, 1)';
        }
        if(deletedLinkIds.includes(DependencyGraphUtils.TLinkToId({source:link.source.id,target:link.target.id}))){
          return 'rgba(255, 0, 0, 1)';
        }
        return '';
      },
      nodeCanvasObject: (node: any, ctx: any) =>
        DependencyGraphUtils.PaintNodeRingForShowDifference(
          node,
          ctx,
          addedNodeIds.includes(node.id),
          deletedNodeIds.includes(node.id)
        ),
      onNodeClick: (node: any) => {},
      onNodeHover: (node: any) => {},
      onLinkClick: (link: any) => {},
      onLinkHover: (link: any) => {},
    };
  }
}
