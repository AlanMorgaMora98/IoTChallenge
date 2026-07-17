import { ITelemetryRepository } from "../domain/repositories/telemetryRepository.interface";
import { IDeviceConfigRepository } from "../domain/repositories/deviceConfigRepository.interface";
import { SqliteAlertRepository } from "../infrastructure/persistence/sqliteAlertRepository";
import { TelemetryReading, AlertState } from "../domain/entities";

export class AlertService {
  constructor(
    private telemetryRepo: ITelemetryRepository,
    private alertRepo: SqliteAlertRepository,
    private configRepo: IDeviceConfigRepository,
  ) {}

  public async processNewTelemetry(reading: TelemetryReading): Promise<void> {
    const { deviceId } = reading;

    const config = await this.configRepo.getByDeviceId(deviceId);
    if (!config) {
      console.log(
        `⚠️ [AlertService] No se encontró configuración de alertas para el dispositivo: ${deviceId}. Se omite evaluación.`,
      );
      return;
    }

    const windowMs = config.windowMinutes * 60 * 1000;
    const cutoffTime = new Date(reading.timestamp.getTime() - windowMs);

    // 3. Traer de la base de datos ÚNICAMENTE las lecturas que caen en esa ventana de tiempo
    const windowReadings = await this.telemetryRepo.getReadingsSince(
      deviceId,
      cutoffTime,
    );

    const totalReadings = windowReadings.length;
    if (totalReadings === 0) return;

    //COLD START
    const expectedReadingsInWindow =
      (config.windowMinutes * 60) / config.intervalSeconds;

    if (totalReadings < expectedReadingsInWindow) {
      console.log(
        `⏳ [Warm-up - ${deviceId}] Esperando a completar la ventana de tiempo. ` +
          `Lecturas: ${totalReadings}/${expectedReadingsInWindow} acumuladas.`,
      );
      return;
    }
    // =========================================================================

    // 4. Calcular cuántas de estas lecturas están dentro del rango óptimo de temperatura
    const okReadingsCount = windowReadings.filter(
      (r) =>
        r.temperatureC >= config.minTemp && r.temperatureC <= config.maxTemp,
    ).length;

    // Porcentaje de estabilidad real en la ventana de tiempo
    const okPercentage = (okReadingsCount / totalReadings) * 100;

    console.log(`📊 [Evaluando - ${deviceId}]`);
    console.log(
      `   └─ Temperatura actual: ${reading.temperatureC}°C (Rango óptimo: ${config.minTemp}°C - ${config.maxTemp}°C)`,
    );
    console.log(
      `   └─ Muestras reales en ventana de ${config.windowMinutes} min: ${totalReadings} lecturas`,
    );
    console.log(
      `   └─ Estabilidad de la carga: ${okPercentage.toFixed(1)}% (Mínimo requerido: ${config.minRequiredOkPercentage}%)`,
    );

    // 5. Gestión de Alertas (Active / Resolved)
    const activeAlert = await this.alertRepo.findActiveByDevice(deviceId);

    if (okPercentage < config.minRequiredOkPercentage) {
      if (!activeAlert) {
        console.warn(
          `🚨 [NEW ALERT] ¡device ${deviceId} cayó al ${okPercentage.toFixed(1)}%!`,
        );
        await this.alertRepo.create({
          deviceId,
          state: AlertState.ACTIVE,
          triggerValue: reading.temperatureC,
          startedAt: reading.timestamp,
          acknowledgedAt: null,
          resolvedAt: null,
          createdAt: reading.timestamp,
        });
      } else {
        console.log(
          `⚠️ [Alerta Activa] El dispositivo ${deviceId} continúa fuera de estabilidad (${okPercentage.toFixed(1)}%).`,
        );
      }
    } else {
      if (activeAlert) {
        console.log(
          `✅ [ALERTA AUTO-RESUELTA] El clima en ${deviceId} se ha normalizado. Estabilidad recuperada al ${okPercentage.toFixed(1)}%.`,
        );
        await this.alertRepo.resolve(activeAlert.alertId!, reading.timestamp);
      }
    }
  }
}
