import { Alert } from "../entities";

export interface IAlertRepository {
  create(alert: Omit<Alert, "alertId">): Promise<void>;
  findActiveByDevice(deviceId: string): Promise<Alert | null>;
  findAllByDevice(deviceId: string): Promise<Alert[]>;
  acknowledgeByDeviceId(deviceId: string): Promise<Alert | null>;
  resolve(alertId: number, resolvedAt: Date): Promise<void>;
}
