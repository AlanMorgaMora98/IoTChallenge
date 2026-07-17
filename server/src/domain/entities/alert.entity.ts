export type AlertState = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";

export interface Alert {
  id: string;
  deviceId: string;
  state: AlertState;
  temperatureThreshold: number;
  startedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}
