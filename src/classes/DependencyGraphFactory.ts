import { TDisplayNodeInfo } from "../entities/TDisplayNodeInfo";
import { DependencyGraphUtils, HighlightInfo } from "./DependencyGraphUtils";

export class DependencyGraphFactory {
  private constructor() {}

  static Create(
    highlightInfo: HighlightInfo,
    setHighlightInfo: (info: HighlightInfo) => void,
    graphRef: any,
    setDisplayNodeInfo: (info: TDisplayNodeInfo | null) => void
  ) {
    const { highlightLinks, highlightNodes, focusNode } = highlightInfo;
    return {
      ...DependencyGraphUtils.GraphBasicSettings,
      linkDirectionalArrowLength: (link: any) =>
        highlightLinks.has(link) ? 6 : 3,
      linkWidth: (link: any) => (highlightLinks.has(link) ? 7 : 1),
      linkDirectionalParticleWidth: (link: any) =>
        highlightLinks.has(link) ? 6 : 4,
      nodeCanvasObject: (node: any, ctx: any) =>
        DependencyGraphUtils.PaintNodeRing(
          node,
          ctx,
          highlightNodes.has(node),
          focusNode
        ),
      onNodeClick: (node: any) => {
        if (highlightInfo.focusNode === node) {
          setHighlightInfo(this.ClearHighlight(highlightInfo));
          setDisplayNodeInfo(null);
        } else {
          this.OnClick(node, graphRef, setDisplayNodeInfo);
          setHighlightInfo(this.HighlightOnNodeHover(node, highlightInfo));
        }
      },
      onNodeHover: (node: any) => {},
      onLinkClick: (link: any) => {
        if (
          highlightInfo.highlightLinks.has(link) &&
          !highlightInfo.focusNode
        ) {
          setHighlightInfo(this.ClearHighlight(highlightInfo));
          setDisplayNodeInfo(null);
        } else {
          setHighlightInfo(this.HighlightOnLinkHover(link, highlightInfo));
        }
      },
      onLinkHover: (link: any) => {},
    };
  }

  static OnClick(
    node: any,
    graphRef: any,
    setDisplayNodeInfo: (info: TDisplayNodeInfo | null) => void
  ) {
    let type: "EX" | "SRV" | "EP" = "EP";
    if (node.id === "null") type = "EX";
    else if (node.group === node.id) type = "SRV";

    const [service, namespace, version, method, labelName] =
      node.id.split("\t");
    setDisplayNodeInfo({
      labelName,
      type,
      service,
      namespace,
      version,
      name: node.name,
      uniqueServiceName: `${service}\t${namespace}\t${version}`,
      method,
    });
    // DependencyGraphUtils.ZoomOnClick(node, graphRef);
  }

  static HighlightOnNodeHover(node: any, info: HighlightInfo): HighlightInfo {
    const { highlightNodes, highlightLinks } = this.ClearHighlight(info);
    if (node) {
      highlightNodes.add(node);
      node.highlight.forEach((n: any) => highlightNodes.add(n));
      node.links.forEach((l: any) => highlightLinks.add(l));
    }
    return { highlightNodes, highlightLinks, focusNode: node || null };
  }

  static HighlightOnLinkHover(link: any, info: HighlightInfo): HighlightInfo {
    const { highlightNodes, highlightLinks } = this.ClearHighlight(info);
    if (link) {
      highlightLinks.add(link);
      const reversed = link.target.links.find(
        (l: any) => l.target === link.source
      );
      if (reversed) highlightLinks.add(reversed);
      highlightNodes.add(link.source);
      highlightNodes.add(link.target);
    }
    return { highlightNodes, highlightLinks, focusNode: null };
  }

  static ClearHighlight(info: HighlightInfo): HighlightInfo {
    const { highlightNodes, highlightLinks } = info;
    highlightNodes.clear();
    highlightLinks.clear();
    return { highlightNodes, highlightLinks, focusNode: null };
  }
}
