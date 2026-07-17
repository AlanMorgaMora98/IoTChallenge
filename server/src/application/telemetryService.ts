import { TelemetryReading } from "../domain/entities";

export class TelemetryService {
  // Almacén en memoria temporal para ver el histórico de lecturas que entran
  private telemetryHistory: TelemetryReading[] = [];

  // Límite para que la memoria no crezca infinitamente durante pruebas prolongadas
  private readonly MAX_HISTORY_SIZE = 1000;

  /**
   * Registra una nueva lectura de telemetría en el sistema
   */
  public async registerReading(reading: TelemetryReading): Promise<void> {
    // 1. Guardamos en nuestro histórico en memoria
    this.telemetryHistory.push(reading);

    // Mantenemos el tamaño del array bajo control (cola FIFO)
    if (this.telemetryHistory.length > this.MAX_HISTORY_SIZE) {
      this.telemetryHistory.shift();
    }

    // 2. Log de confirmación visual para que el operador (tú) vea la ingesta en tiempo real
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

  /**
   * Retorna todo el historial acumulado para consumirse desde un endpoint HTTP
   */
  public getHistory(): TelemetryReading[] {
    return [...this.telemetryHistory];
  }

  /**
   * Obtiene el historial de un dispositivo específico
   */
  public getHistoryByDevice(deviceId: string): TelemetryReading[] {
    return this.telemetryHistory.filter((r) => r.deviceId === deviceId);
  }
}
