export enum AlertState {
  ACTIVE = "ACTIVE",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  RESOLVED = "RESOLVED",
}

export interface Alert {
  alertId?: number;
  deviceId: string;
  state: AlertState;
  triggerValue: number;
  startedAt: Date;
  acknowledgedAt?: Date | null;
  resolvedAt?: Date | null;
  createdAt: Date;
}
