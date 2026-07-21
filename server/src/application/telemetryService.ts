import { TelemetryReading } from "../domain/entities";

export class TelemetryService {
  private telemetryHistory: TelemetryReading[] = [];

  private readonly MAX_HISTORY_SIZE = 1000;

  public async registerReading(reading: TelemetryReading): Promise<void> {
    this.telemetryHistory.push(reading);

    if (this.telemetryHistory.length > this.MAX_HISTORY_SIZE) {
      this.telemetryHistory.shift();
    }

    console.log(`\n📥 [INGESTA] Dispositivo: ${reading.deviceId}`);
    console.log(
      `   🌡️ Temp: ${reading.temperatureC}°C | 💧 Hum: ${reading.humidityPct}%`,
    );

    console.log(
      `   🚨 Buzzer: ${reading.buzzerActive ? "ENCENDIDO 🔊" : "APAGADO 🔇"} | Sec: #${reading.sequenceNumber}`,
    );

    console.log(`   ⏰ Timestamp: ${reading.timestamp.toISOString()}`);

    console.log(
      `   📊 Total lecturas en memoria: ${this.telemetryHistory.length}`,
    );
  }

  public getHistory(): TelemetryReading[] {
    return [...this.telemetryHistory];
  }

  public getHistoryByDevice(deviceId: string): TelemetryReading[] {
    return this.telemetryHistory.filter((r) => r.deviceId === deviceId);
  }
}
