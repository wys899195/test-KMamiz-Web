import BackgroundTaskManager from "./BackgroundTaskManager";

export type Unsubscribe = () => boolean;

export class DataView {
  private static instance?: DataView;
  static getInstance = () => this.instance || (this.instance = new this());

  private readonly observers: Map<string, (res: Response, data?: any) => void>;
  private constructor() {
    this.observers = new Map<string, (data: any) => void>();
    BackgroundTaskManager.getInstance().register("dataview-task", async () => {
      this.observers.forEach((_, url) => this.trigger(url));
    });
  }

  subscribe<T>(
    url: string,
    next: (res: Response, data?: T) => void
  ): Unsubscribe {
    this.observers.set(url, next);
    this.trigger(url);
    return () => this.observers.delete(url);
  }

  private async trigger(url: string) {
    const next = this.observers.get(url);
    if (!next) return;
    const res = await fetch(url);
    const data = res.ok ? await res.json() : undefined;
    next(res, data);
  }
}
