export interface IDeviceTwinService {
  updateDesiredProperties(
    deviceId: string,
    config: {
      minTemp: number;
      maxTemp: number;
      windowMinutes: number;
      intervalSeconds: number;
      minRequiredOkPercentage: number;
    },
  ): Promise<void>;

  silenceBuzzer(deviceId: string): Promise<void>;
}
