import { TelemetryReading } from "../entities";

export interface ITelemetryRepository {
  save(reading: TelemetryReading): Promise<void>;
  saveMany(readings: TelemetryReading[]): Promise<void>;
  getHistory(deviceId?: string): Promise<TelemetryReading[]>;
  getRecentDeviceHistory(
    deviceId: string,
    daysLimit: number,
  ): Promise<TelemetryReading[]>;
  getReadingsSince(deviceId: string, since: Date): Promise<TelemetryReading[]>;
}
