import { ITelemetryRepository } from "../domain/repositories/telemetryRepository.interface";
import { IDeviceConfigRepository } from "../domain/repositories/deviceConfigRepository.interface";
import { SqliteAlertRepository } from "../infrastructure/persistence/sqliteAlertRepository";
import { TelemetryReading, AlertState } from "../domain/entities";

export class AlertService {
  private deviceQueues = new Map<string, Promise<void>>();

  constructor(
    private telemetryRepo: ITelemetryRepository,
    private alertRepo: SqliteAlertRepository,
    private configRepo: IDeviceConfigRepository,
  ) {}

  public async processNewTelemetry(reading: TelemetryReading): Promise<void> {
    const { deviceId } = reading;
    const currentQueue = this.deviceQueues.get(deviceId) || Promise.resolve();

    const nextQueue = currentQueue.then(async () => {
      try {
        await this.executeAlertEvaluation(reading);
      } catch (error) {
        console.error(
          `[AlertService - ${deviceId}] Error processing telemetry:`,
          error,
        );
      }
    });

    this.deviceQueues.set(deviceId, nextQueue);
    return nextQueue;
  }

  private async executeAlertEvaluation(
    reading: TelemetryReading,
  ): Promise<void> {
    const { deviceId } = reading;

    const config = await this.configRepo.getByDeviceId(deviceId);
    if (!config) {
      console.log(`[AlertService] No configuration: ${deviceId}.`);
      return;
    }

    const latestTimestamp =
      (await this.telemetryRepo.getLatestTimestamp(deviceId)) ??
      reading.timestamp;

    const windowMs = config.windowMinutes * 60 * 1000;
    const cutoffTime = new Date(latestTimestamp.getTime() - windowMs);

    const windowReadings = await this.telemetryRepo.getReadingsSince(
      deviceId,
      cutoffTime,
    );
    if (windowReadings.length === 0) return;

    const totalCycleSamples =
      (config.windowMinutes * 60) / config.intervalSeconds;
    const minOkFraction =
      config.minRequiredOkPercentage > 1
        ? config.minRequiredOkPercentage / 100
        : config.minRequiredOkPercentage;
    const maxAllowedBadSamples = totalCycleSamples * (1 - minOkFraction);

    const badReadingsCount = windowReadings.filter(
      (r) => r.temperatureC < config.minTemp || r.temperatureC > config.maxTemp,
    ).length;

    const isThermalViolation = badReadingsCount > maxAllowedBadSamples;
    const activeAlert = await this.alertRepo.findActiveByDevice(deviceId);

    if (isThermalViolation) {
      if (!activeAlert) {
        console.warn(
          `🚨 [NEW ALERT - ${deviceId}] Temperature out of range ` +
            `(${badReadingsCount} / ${maxAllowedBadSamples.toFixed(2)} allowed).`,
        );
        await this.alertRepo.create({
          deviceId,
          state: AlertState.ACTIVE,
          triggerValue: reading.temperatureC,
          startedAt: latestTimestamp,
          acknowledgedAt: null,
          resolvedAt: null,
          createdAt: latestTimestamp,
        });
      } else {
        console.log(`⚠️ [Alert ACTIVE - ${deviceId}] out of stability.`);
      }
      return;
    }

    if (!activeAlert) return;

    const recoveryStreak = Math.max(1, Math.round(totalCycleSamples));
    const recentReadings = await this.telemetryRepo.getRecentReadings(
      deviceId,
      recoveryStreak,
    );

    const hasRecovered =
      recentReadings.length >= recoveryStreak &&
      recentReadings.every(
        (r) =>
          r.temperatureC >= config.minTemp && r.temperatureC <= config.maxTemp,
      );

    if (hasRecovered) {
      console.log(`✅ [ALERT RESOLVED - ${deviceId}] Temperature stabilized.`);
      await this.alertRepo.resolve(activeAlert.alertId!, latestTimestamp);
    }
  }
}
