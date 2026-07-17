import { db } from "./sqliteDb";
import { TelemetryReading } from "../../domain/entities/index"; // Tu ruta de importación actual

export class SqliteTelemetryRepository {
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
      reading.timestamp.toISOString(), // <-- Convertimos el Date a string para SQLite
    );
  }

  public async getRecentReadings(
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
      timestamp: new Date(row.timestamp), // <-- Convertimos el string de SQLite de vuelta a un Date real
    }));
  }
}
