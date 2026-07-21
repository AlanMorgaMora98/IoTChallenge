export interface DeviceSummary {
  deviceId: string;
  status: string;
  connectionState: string;
  lastActivityTime: Date | null;
}

export interface IDeviceRepository {
  getAllDevices(): Promise<DeviceSummary[]>;
}
