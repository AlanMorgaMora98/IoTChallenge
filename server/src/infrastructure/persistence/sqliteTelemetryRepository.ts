import { db } from "./sqliteDb";
import { TelemetryReading } from "../../domain/entities";
import { ITelemetryRepository } from "../../domain/repositories/telemetryRepository.interface";

export class SqliteTelemetryRepository implements ITelemetryRepository {
  public async save(reading: TelemetryReading): Promise<void> {
    const query = db.prepare(`
      INSERT OR IGNORE INTO telemetry (
        deviceId, 
        temperatureC, 
        humidityPct, 
        buzzerActive, 
        sequenceNumber, 
        timestamp
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    query.run(
      reading.deviceId,
      reading.temperatureC,
      reading.humidityPct,
      reading.buzzerActive ? 1 : 0,
      reading.sequenceNumber,
      reading.timestamp.toISOString(),
    );
  }

  public async saveMany(readings: TelemetryReading[]): Promise<void> {
    const insert = db.prepare(`
      INSERT OR IGNORE INTO telemetry (
        deviceId,
        temperatureC,
        humidityPct,
        buzzerActive,
        sequenceNumber,
        timestamp
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const write = db.transaction(() => {
      for (const reading of readings) {
        insert.run(
          reading.deviceId,
          reading.temperatureC,
          reading.humidityPct,
          reading.buzzerActive ? 1 : 0,
          reading.sequenceNumber,
          reading.timestamp.toISOString(),
        );
      }
    });

    write();
  }

  public async getHistory(deviceId?: string): Promise<TelemetryReading[]> {
    const query = deviceId
      ? db.prepare(`
          SELECT deviceId, temperatureC, humidityPct, buzzerActive, sequenceNumber, timestamp
          FROM telemetry
          WHERE deviceId = ?
          ORDER BY timestamp DESC
        `)
      : db.prepare(`
          SELECT deviceId, temperatureC, humidityPct, buzzerActive, sequenceNumber, timestamp
          FROM telemetry
          ORDER BY timestamp DESC
        `);

    const rows = deviceId
      ? (query.all(deviceId) as any[])
      : (query.all() as any[]);

    return rows.map((row) => ({
      deviceId: row.deviceId,
      temperatureC: row.temperatureC,
      humidityPct: row.humidityPct,
      buzzerActive: row.buzzerActive === 1,
      sequenceNumber: row.sequenceNumber,
      timestamp: new Date(row.timestamp),
    }));
  }

  public async getRecentDeviceHistory(
    deviceId: string,
    limit: number = 10,
  ): Promise<TelemetryReading[]> {
    const query = db.prepare(`
      SELECT deviceId, temperatureC, humidityPct, buzzerActive, sequenceNumber, timestamp
      FROM telemetry
      WHERE deviceId = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const rows = query.all(deviceId, limit) as any[];

    return rows.map((row) => ({
      deviceId: row.deviceId,
      temperatureC: row.temperatureC,
      humidityPct: row.humidityPct,
      buzzerActive: row.buzzerActive === 1,
      sequenceNumber: row.sequenceNumber,
      timestamp: new Date(row.timestamp),
    }));
  }

  public async getRecentReadings(
    deviceId: string,
    limit: number = 10,
  ): Promise<TelemetryReading[]> {
    return this.getRecentDeviceHistory(deviceId, limit);
  }

  public async getReadingsSince(
    deviceId: string,
    since: Date,
  ): Promise<TelemetryReading[]> {
    const query = db.prepare(`
      SELECT id, deviceId, temperatureC, humidityPct, buzzerActive, sequenceNumber, timestamp
      FROM telemetry
      WHERE deviceId = ? AND timestamp >= ?
      ORDER BY timestamp DESC
    `);

    // Pasamos la fecha en formato ISO string para que SQLite pueda compararla correctamente
    const rows = query.all(deviceId, since.toISOString()) as any[];

    return rows.map((row) => ({
      id: row.id,
      deviceId: row.deviceId,
      temperatureC: row.temperatureC,
      humidityPct: row.humidityPct,
      buzzerActive: row.buzzerActive === 1,
      sequenceNumber: row.sequenceNumber,
      timestamp: new Date(row.timestamp),
    }));
  }

  public async getLatestTimestamp(deviceId: string): Promise<Date | null> {
    const row = db
      .prepare(
        `SELECT MAX(timestamp) as maxTs FROM telemetry WHERE deviceId = ?`,
      )
      .get(deviceId) as { maxTs: string | null };

    return row.maxTs ? new Date(row.maxTs) : null;
  }
}
