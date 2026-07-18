import { db } from "./sqliteDb";
import { DeviceConfig } from "../../domain/entities";
import { IDeviceConfigRepository } from "../../domain/repositories/deviceConfigRepository.interface";

export class SqliteDeviceConfigRepository implements IDeviceConfigRepository {
  public async getByDeviceId(deviceId: string): Promise<DeviceConfig | null> {
    const query = db.prepare(`
      SELECT deviceId, minTemp, maxTemp, windowMinutes, intervalSeconds, minRequiredOkPercentage
      FROM device_configs
      WHERE deviceId = ?
    `);

    const row = query.get(deviceId) as any;

    if (!row) {
      return null;
    }

    return {
      deviceId: row.deviceId,
      minTemp: row.minTemp,
      maxTemp: row.maxTemp,
      windowMinutes: row.windowMinutes,
      intervalSeconds: row.intervalSeconds,
      minRequiredOkPercentage: row.minRequiredOkPercentage,
    };
  }

  public async save(config: DeviceConfig): Promise<void> {
    const query = db.prepare(`
      INSERT INTO device_configs (deviceId, minTemp, maxTemp, windowMinutes, intervalSeconds, minRequiredOkPercentage)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(deviceId) DO UPDATE SET
        minTemp = excluded.minTemp,
        maxTemp = excluded.maxTemp,
        windowMinutes = excluded.windowMinutes,
        intervalSeconds = excluded.intervalSeconds,
        minRequiredOkPercentage = excluded.minRequiredOkPercentage
    `);

    query.run(
      config.deviceId,
      config.minTemp,
      config.maxTemp,
      config.windowMinutes,
      config.intervalSeconds,
      config.minRequiredOkPercentage,
    );

    console.log(
      `New configuration for device: '${config.deviceId}' saved in db.`,
    );
  }

  public async update(config: DeviceConfig): Promise<void> {
    const query = db.prepare(`
      INSERT INTO device_configs (
        deviceId, minTemp, maxTemp, windowMinutes, intervalSeconds, minRequiredOkPercentage
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(deviceId) DO UPDATE SET
        minTemp = excluded.minTemp,
        maxTemp = excluded.maxTemp,
        windowMinutes = excluded.windowMinutes,
        intervalSeconds = excluded.intervalSeconds,
        minRequiredOkPercentage = excluded.minRequiredOkPercentage
    `);

    query.run(
      config.deviceId,
      config.minTemp,
      config.maxTemp,
      config.windowMinutes,
      config.intervalSeconds,
      config.minRequiredOkPercentage,
    );
  }
}
