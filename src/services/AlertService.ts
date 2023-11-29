import Config from "../../Config";
import { TRiskViolation } from "../entities/TRiskViolation";
import { DataView } from "./DataView";

export default class AlertService {
  private static instance?: AlertService;
  static getInstance = () => this.instance || (this.instance = new this());
  private constructor() {}

  private readonly prefix = `${Config.ApiHost}${Config.ApiPrefix}`;

  subscribeToRiskViolation(
    next: (data: TRiskViolation[]) => void,
    namespace?: string,
    notBefore?: number
  ) {
    const path = `${this.prefix}/alert/violation${
      namespace ? `/${encodeURIComponent(namespace)}` : ""
    }${notBefore ? `?notBefore=${notBefore}` : ""}`;
    return DataView.getInstance().subscribe<TRiskViolation[]>(path, (_, data) =>
      next(data || [])
    );
  }
}
