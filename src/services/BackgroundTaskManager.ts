import AlertManager from "./AlertManager";
import AlertService from "./AlertService";

type TTask = (..._: any[]) => any;

export default class BackgroundTaskManager {
  private static instance?: BackgroundTaskManager;
  static getInstance = () => this.instance || (this.instance = new this());

  private _taskMap: Map<string, TTask>;
  private constructor() {
    this._taskMap = new Map();
    this.startTimer();
    setTimeout(() => this.setup(), 0);
  }

  private setup() {
    // risk monitor
    AlertService.getInstance().subscribeToRiskViolation((violations) => {
      violations.forEach((v) => {
        AlertManager.getInstance().create({
          id: `${v.id}-risk-violation`,
          context: `${v.displayName} violates Risk threshold (at ${new Date(
            v.occursAt
          ).toISOString()})`,
          severity: "warning",
          timestamp: v.timeoutAt,
          notified: false,
          onClickNavigation: `/?s=${encodeURIComponent(
            btoa(v.highlightNodeName)
          )}`,
        });
      });
    });
  }

  register(name: string, task: TTask) {
    this._taskMap.set(name, task);
    task();
  }

  startTimer(interval = 15000) {
    setInterval(() => {
      [...this._taskMap.values()].forEach((t) => t());
    }, interval);
  }
}
