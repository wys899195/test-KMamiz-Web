import { DependencyGraphUtils, GraphDifferenceInfo } from "./DependencyGraphUtils";

export class DiffDetailDependencyGraphFactory {
  private constructor() {}

  static Create(
    graphDifferenceInfo: GraphDifferenceInfo,
    firstServiceNodeId: string,
    secondServiceNodeId:string
  ) {
    const { diffsBetweenTwoServices } = graphDifferenceInfo;
    const targetPairInfo = diffsBetweenTwoServices.find(pairInfo =>
      pairInfo.serviceIdPair.includes(firstServiceNodeId) 
      && pairInfo.serviceIdPair.includes(secondServiceNodeId)
    )
    return {
      ...DependencyGraphUtils.GraphBasicSettings,
      linkDirectionalArrowLength: (link: any) =>
        targetPairInfo?.addedLinkIds.includes(DependencyGraphUtils.TLinkToId({source:link.source.id,target:link.target.id})) 
        || targetPairInfo?.deletedLinkIds.includes(DependencyGraphUtils.TLinkToId({source:link.source.id,target:link.target.id}))
        ? 6 : 3,
      linkWidth: (link: any) => 
        targetPairInfo?.addedLinkIds.includes(DependencyGraphUtils.TLinkToId({source:link.source.id,target:link.target.id})) 
        || targetPairInfo?.deletedLinkIds.includes(DependencyGraphUtils.TLinkToId({source:link.source.id,target:link.target.id}))
        ? 4 : 1,
      linkDirectionalParticleWidth: (link: any) =>
        4,
      linkColor: (link: any) => {
        if (targetPairInfo?.addedLinkIds.includes(DependencyGraphUtils.TLinkToId({source:link.source.id,target:link.target.id}))){
          return 'rgba(0, 255, 0, 1)';
        }
        if(targetPairInfo?.deletedLinkIds.includes(DependencyGraphUtils.TLinkToId({source:link.source.id,target:link.target.id}))){
          return 'rgba(255, 0, 0, 1)';
        }
        return '';
      },
      nodeCanvasObject: (node: any, ctx: any) =>
        DependencyGraphUtils.PaintNodeRingForShowDifference(
          node,
          ctx,
          targetPairInfo?.addedNodeIds.includes(node.id) || false,
          targetPairInfo?.deletedNodeIds.includes(node.id) || false,
        ),
      onNodeClick: (node: any) => {},
      onNodeHover: (node: any) => {},
      onLinkClick: (link: any) => {},
      onLinkHover: (link: any) => {},
    };
  }
}
