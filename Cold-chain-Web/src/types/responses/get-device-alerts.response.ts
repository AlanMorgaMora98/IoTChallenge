export interface DeviceAlertsResponse {
  success: boolean;
  deviceAlerts: DeviceAlert[];
}

export interface DeviceAlert {
  alertId: number;
  deviceId: string;
  state: string;
  triggerValue: number;
  startedAt: Date;
  acknowledgedAt: Date;
  resolvedAt: Date;
  createdAt: Date;
}
