export interface DeviceConfigurationResponse {
  success: boolean;
  deviceConfiguration: DeviceConfiguration;
}

export interface DeviceConfiguration {
  deviceId: string;
  minTemp: number;
  maxTemp: number;
  windowMinutes: number;
  intervalSeconds: number;
  minRequiredOkPercentage: number;
}
