export interface DeviceConfig {
  deviceId: string;
  minTemp: number;
  maxTemp: number;
  windowMinutes: number;
  intervalSeconds: number;
  minRequiredOkPercentage: number;
}
