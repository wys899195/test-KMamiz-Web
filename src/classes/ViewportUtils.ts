export default class ViewportUtils {
  private static instance?: ViewportUtils;
  static getInstance = () => this.instance || (this.instance = new this());

  private handlers: Map<string, (viewport: number[]) => void>;
  private constructor() {
    this.handlers = new Map<string, (viewport: number[]) => void>();
    setTimeout(() => {
      window.addEventListener(
        "resize",
        ViewportUtils.getInstance().onViewportSizeChange
      );
    }, 0);
  }

  /**
   * Subscribe to viewport change, remember to call the unsubscribe function to avoid side-effects.
   * @param onEmit Called on viewport change with parameter [vw, vh]
   * @returns Unsubscribe function
   */
  subscribe(onEmit: ([vw, vh]: number[]) => void) {
    const uniqueName = `${Math.random()}`;
    this.handlers.set(uniqueName, onEmit);
    onEmit([ViewportUtils.getInstance().vw, ViewportUtils.getInstance().vh]);
    return () => {
      ViewportUtils.getInstance().handlers.delete(uniqueName);
    };
  }

  private onViewportSizeChange() {
    [...ViewportUtils.getInstance().handlers.values()].forEach((h) =>
      h([ViewportUtils.getInstance().vw, ViewportUtils.getInstance().vh])
    );
  }

  private get vw() {
    return Math.max(
      document.documentElement.clientWidth || 0,
      window.innerWidth || 0
    );
  }

  private get vh() {
    return Math.max(
      document.documentElement.clientHeight || 0,
      window.innerHeight || 0
    );
  }
}
