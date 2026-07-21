export interface TelemetryReading {
  deviceId: string;
  temperatureC: number;
  humidityPct: number;
  buzzerActive: boolean;
  sequenceNumber: number;
  timestamp: Date;
}
