export type TAlert = {
  id: string;
  context: string;
  severity: "success" | "info" | "warning" | "error";
  timestamp: number;
  notified: boolean;
  onClickNavigation?: string;
};
