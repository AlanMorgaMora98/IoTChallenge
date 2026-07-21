import { DeviceConfig } from "../entities";

export interface IDeviceConfigRepository {
  getByDeviceId(deviceId: string): Promise<DeviceConfig | null>;
  save(config: DeviceConfig): Promise<void>;
  update(config: DeviceConfig): Promise<void>;
}
