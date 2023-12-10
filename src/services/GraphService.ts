import Config from "../../Config";
import { Color } from "../classes/ColorUtils";
import { TLineChartData } from "../entities/TLineChartData";
import { TChordData, TChordRadius } from "../entities/TChordData";
import { TGraphData } from "../entities/TGraphData";
import { TServiceCoupling } from "../entities/TServiceCoupling";
import { TServiceInstability } from "../entities/TServiceInstability";
import { TServiceTestAPI} from "../entities/TServiceTestAPI";
import { TTotalServiceInterfaceCohesion } from "../entities/TTotalServiceInterfaceCohesion";
import { DataView } from "./DataView";
import { TRequestInfoChartData } from "../entities/TRequestInfoChartData";

type RawChordData = {
  nodes: {
    id: string;
    name: string;
  }[];
  links: TChordRadius[];
};
export default class GraphService {
  private static instance?: GraphService;
  static getInstance = () => this.instance || (this.instance = new this());
  private constructor() {}

  private readonly prefix = `${Config.ApiHost}${Config.ApiPrefix}`;

  private subscribeToChord(next: (data?: TChordData) => void, path: string) {
    return DataView.getInstance().subscribe<RawChordData>(
      `${this.prefix}${path}`,
      (_, data) => {
        next(
          data
            ? {
                ...data,
                nodes: data.nodes.map((n) => ({
                  ...n,
                  fill: Color.generateFromString(n.id).hex,
                })),
              }
            : data
        );
      }
    );
  }

  private subscribeToArray<T>(path: string, next: (data: T[]) => void) {
    return DataView.getInstance().subscribe<T[]>(path, (_, data) =>
      next(data || [])
    );
  }

  private async get<T>(path: string) {
    const res = await fetch(path);
    if (!res.ok) return null;
    return (await res.json()) as T;
  }
  private async getChordData(path: string): Promise<TChordData | null> {
    const rawData = await GraphService.getInstance().get<RawChordData>(
      `${this.prefix}${path}`
    );
    if (!rawData) return null;
    return {
      ...rawData,
      nodes: rawData.nodes.map((n) => ({
        ...n,
        fill: Color.generateFromString(n.id).hex,
      })),
    };
  }

  async getDependencyGraph(showEndpoint: boolean) {
    const path = `${this.prefix}/graph/dependency/${
      showEndpoint ? "endpoint" : "service"
    }`;
    return await GraphService.getInstance().get<TGraphData>(path);
  }

  async getAreaLineData(uniqueServiceName?: string, notBefore?: number) {
    const postfix = uniqueServiceName
      ? `/${encodeURIComponent(uniqueServiceName)}`
      : "";
    const query = notBefore ? `?notBefore=${notBefore}` : "";
    const path = `${this.prefix}/graph/line${postfix}${query}`;
    return await GraphService.getInstance().get<TLineChartData[]>(path);
  }

  async getDirectChord() {
    return await this.getChordData("/graph/chord/direct");
  }

  async getInDirectChord() {
    return await this.getChordData("/graph/chord/indirect");
  }

  async getServiceCohesion(namespace?: string) {
    const path = `${this.prefix}/graph/cohesion${
      namespace ? `/${encodeURIComponent(namespace)}` : ""
    }`;
    return await GraphService.getInstance().get<
      TTotalServiceInterfaceCohesion[]
    >(path);
  }
  async getServiceInstability(namespace?: string) {
    const path = `${this.prefix}/graph/instability${
      namespace ? `/${encodeURIComponent(namespace)}` : ""
    }`;
    return await GraphService.getInstance().get<TServiceInstability[]>(path);
  }
  async getServiceCoupling(namespace?: string) {
    const path = `${this.prefix}/graph/coupling${
      namespace ? `/${encodeURIComponent(namespace)}` : ""
    }`;
    return await GraphService.getInstance().get<TServiceCoupling[]>(path);
  }

  subscribeToEndpointDependencyGraph(next: (data?: TGraphData) => void) {
    return DataView.getInstance().subscribe<TGraphData>(
      `${this.prefix}/graph/dependency/endpoint`,
      (_, data) => next(data)
    );
  }

  subscribeToServiceDependencyGraph(next: (data?: TGraphData) => void) {
    return DataView.getInstance().subscribe<TGraphData>(
      `${this.prefix}/graph/dependency/service`,
      (_, data) => next(data)
    );
  }

  subscribeToLineChartData(
    next: (data?: TLineChartData) => void,
    uniqueServiceName?: string,
    notBefore?: number
  ) {
    const postfix = uniqueServiceName
      ? `/${encodeURIComponent(uniqueServiceName)}`
      : "";
    const query = notBefore ? `?notBefore=${notBefore}` : "";
    const path = `${this.prefix}/graph/line${postfix}${query}`;

    return DataView.getInstance().subscribe<TLineChartData>(path, (_, data) =>
      next(data)
    );
  }

  subscribeToDirectChord(next: (data?: TChordData) => void) {
    return GraphService.getInstance().subscribeToChord(
      next,
      "/graph/chord/direct"
    );
  }
  subscribeToInDirectChord(next: (data?: TChordData) => void) {
    return GraphService.getInstance().subscribeToChord(
      next,
      "/graph/chord/indirect"
    );
  }

  subscribeToServiceCohesion(
    next: (data: TTotalServiceInterfaceCohesion[]) => void,
    namespace?: string
  ) {
    const path = `${this.prefix}/graph/cohesion${
      namespace ? `/${encodeURIComponent(namespace)}` : ""
    }`;
    return GraphService.getInstance().subscribeToArray(path, next);
  }

  subscribeToServiceInstability(
    next: (data: TServiceInstability[]) => void,
    namespace?: string
  ) {
    const path = `${this.prefix}/graph/instability${
      namespace ? `/${encodeURIComponent(namespace)}` : ""
    }`;
    return GraphService.getInstance().subscribeToArray(path, next);
  }

  subscribeToServiceCoupling(
    next: (data: TServiceCoupling[]) => void,
    namespace?: string
  ) {
    const path = `${this.prefix}/graph/coupling${
      namespace ? `/${encodeURIComponent(namespace)}` : ""
    }`;
    return GraphService.getInstance().subscribeToArray(path, next);
  }

  subscribeToTestAPI(
    next: (data: TServiceTestAPI[]) => void,
    namespace?: string
  ) {
    const path = `${this.prefix}/graph/testAPI${
      namespace ? `/${encodeURIComponent(namespace)}` : ""
    }`;
    return GraphService.getInstance().subscribeToArray(path, next);
  }

  subscribeToRequestInfoChartData(
    next: (data: TRequestInfoChartData | undefined) => void,
    uniqueName: string,
    ignoreServiceVersion = false,
    notBefore = 86400000
  ) {
    const path = `${this.prefix}/graph/requests/${encodeURIComponent(
      uniqueName
    )}?ignoreServiceVersion=${ignoreServiceVersion}&notBefore=${notBefore}`;
    return DataView.getInstance().subscribe<TRequestInfoChartData>(
      path,
      (_, data) => next(data)
    );
  }
}
