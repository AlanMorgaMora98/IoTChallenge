import { TelemetryReading } from "../entities/index";

export interface ITelemetryRepository {
  saveMany(readings: TelemetryReading[]): Promise<void>;
  getHistory(deviceId?: string): Promise<TelemetryReading[]>;
  getRecentDeviceHistory(
    deviceId: string,
    daysLimit: number,
  ): Promise<TelemetryReading[]>;
}
