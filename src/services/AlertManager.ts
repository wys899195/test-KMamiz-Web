import { TAlert } from "../entities/TAlert";

export default class AlertManager {
  private static readonly ALERT_TIMEOUT = 5000;
  private static readonly STORAGE_KEY = "KMAMIZ_ALERT";
  private static instance?: AlertManager;
  static getInstance = () => this.instance || (this.instance = new this());

  private _alerts: Map<string, TAlert>;
  private _observers: ((alerts: TAlert[]) => void)[];
  private _rawObservers: ((alerts: TAlert[]) => void)[];
  private constructor() {
    this._alerts = new Map();
    this._observers = [];
    this._rawObservers = [];
    this.load();
    setInterval(() => this.interval(), AlertManager.ALERT_TIMEOUT);
  }

  create(alert: TAlert, update = false) {
    if (this._alerts.has(alert.id) && !update) {
      const existing = this._alerts.get(alert.id)!;
      this._alerts.set(alert.id, {
        ...existing,
        context: alert.context,
        timestamp: alert.timestamp,
      });
    } else this._alerts.set(alert.id, alert);

    this.save();
  }

  update(alert: TAlert) {
    this.create(alert, true);
    this.interval();
  }

  delete(id: string) {
    this._alerts.delete(id);
  }

  notifyAll() {
    this.modifyNotify(true);
  }

  resetNotify() {
    this.modifyNotify(false);
  }

  toggleNotify() {
    if (this.getIntervalAlerts().length === 0) this.resetNotify();
    else this.notifyAll();
  }

  private modifyNotify(notified: boolean) {
    this._alerts = new Map(
      [...this._alerts.entries()].map(([id, alert]) => [
        id,
        { ...alert, notified },
      ])
    );
    this.interval();
  }

  listen(observer: (alerts: TAlert[]) => void, listenRaw = false) {
    const observerList = listenRaw ? this._rawObservers : this._observers;
    const obs = observer;
    observerList.push(obs);
    obs(this.getIntervalAlerts(listenRaw));
    return () => {
      this._observers.filter((o) => o !== obs);
      this._rawObservers.filter((o) => o !== obs);
    };
  }

  private getIntervalAlerts(raw = false) {
    this.clearOutdated();
    const baseAlerts = [...this._alerts.values()].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    if (raw) return baseAlerts;
    const alerts = baseAlerts.filter((a) => !a.notified);
    return alerts;
  }

  private interval() {
    this._observers.forEach((o) => o(this.getIntervalAlerts()));
    this._rawObservers.forEach((o) => o(this.getIntervalAlerts(true)));
  }

  private clearOutdated() {
    this._alerts = new Map(
      [...this._alerts.entries()].filter(([_, alert]) => {
        return Date.now() - alert.timestamp < AlertManager.ALERT_TIMEOUT;
      })
    );
  }

  private save() {
    localStorage.setItem(
      AlertManager.STORAGE_KEY,
      JSON.stringify([...this._alerts.entries()])
    );
  }
  private load() {
    const data = localStorage.getItem(AlertManager.STORAGE_KEY);
    if (!data) return;
    const parsed = JSON.parse(data) as [string, TAlert][];
    this._alerts = new Map(parsed);
    this.clearOutdated();
  }
}
