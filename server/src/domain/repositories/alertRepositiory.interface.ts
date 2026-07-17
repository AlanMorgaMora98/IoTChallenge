import { Alert } from "../entities";

export interface IAlertRepository {
  create(alert: Alert): Promise<Alert>;
  update(alert: Alert): Promise<Alert>;
  findActiveByDeviceId(deviceId: string): Promise<Alert | null>;
  findAll(): Promise<Alert[]>;
}
