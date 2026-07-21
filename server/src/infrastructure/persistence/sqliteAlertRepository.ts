import { db } from "./sqliteDb";
import { Alert, AlertState } from "../../domain/entities";
import { IAlertRepository } from "../../domain/repositories/alertRepositiory.interface";

export class SqliteAlertRepository implements IAlertRepository {
  public async create(alert: Omit<Alert, "alertId">): Promise<void> {
    const query = db.prepare(`
      INSERT INTO alerts (deviceId, state, triggerValue, startedAt, acknowledgedAt, resolvedAt, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    query.run(
      alert.deviceId,
      alert.state,
      alert.triggerValue,
      alert.startedAt.toISOString(),
      alert.acknowledgedAt ? alert.acknowledgedAt.toISOString() : null,
      alert.resolvedAt ? alert.resolvedAt.toISOString() : null,
      alert.createdAt.toISOString(),
    );
  }

  public async findActiveByDevice(deviceId: string): Promise<Alert | null> {
    const query = db.prepare(`
      SELECT alertId, deviceId, state, triggerValue, startedAt, acknowledgedAt, resolvedAt
      FROM alerts
      WHERE deviceId = ? AND state IN ('ACTIVE', 'ACKNOWLEDGED')
      LIMIT 1
    `);

    const row = query.get(deviceId) as any;

    if (!row) return null;

    return {
      alertId: row.alertId,
      deviceId: row.deviceId,
      state: row.state as AlertState,
      triggerValue: row.triggerValue,
      startedAt: new Date(row.startedAt),
      acknowledgedAt: row.acknowledgedAt ? new Date(row.acknowledgedAt) : null,
      resolvedAt: row.resolvedAt ? new Date(row.resolvedAt) : null,
      createdAt: new Date(row.createdAt),
    };
  }

  public async findAllByDevice(deviceId: string): Promise<Alert[]> {
    const query = db.prepare(`
    SELECT *
    FROM alerts
    WHERE deviceId = ?
    ORDER BY createdAt DESC
  `);

    const rows = query.all(deviceId) as Alert[];

    return rows;
  }

  // public async acknowledge(
  //   alertId: number,
  //   acknowledgedAt: Date,
  // ): Promise<void> {
  //   const query = db.prepare(`
  //     UPDATE alerts
  //     SET state = 'ACKNOWLEDGED', acknowledgedAt = ?
  //     WHERE alertId = ? AND state = 'ACTIVE'
  //   `);

  //   query.run(acknowledgedAt.toISOString(), alertId);
  // }

  public async acknowledgeByDeviceId(deviceId: string): Promise<Alert | null> {
    const findQuery = db.prepare(`
      SELECT *
      FROM alerts
      WHERE deviceId = ? AND state = 'ACTIVE'
      ORDER BY createdAt DESC
      LIMIT 1
    `);

    const updateQuery = db.prepare(`
      UPDATE alerts
      SET state = 'ACKNOWLEDGED', acknowledgedAt = ?
      WHERE alertId = ?
    `);

    const runTransaction = db.transaction(() => {
      const alert = findQuery.get(deviceId) as Alert | undefined;

      if (!alert) {
        return null;
      }

      const now = new Date();
      updateQuery.run(now.toISOString(), alert.alertId);

      return {
        ...alert,
        state: "ACKNOWLEDGED",
        acknowledgedAt: now,
      } as Alert;
    });

    return runTransaction();
  }

  public async resolve(alertId: number, resolvedAt: Date): Promise<void> {
    const query = db.prepare(`
      UPDATE alerts
      SET state = 'RESOLVED', resolvedAt = ?
      WHERE alertId = ?
    `);

    query.run(resolvedAt.toISOString(), alertId);
  }
}
