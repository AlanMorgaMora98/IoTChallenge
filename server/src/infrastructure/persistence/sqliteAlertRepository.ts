import { db } from "./sqliteDb";
import { Alert, AlertState } from "../../domain/entities";

export class SqliteAlertRepository {
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

  public async acknowledge(
    alertId: number,
    acknowledgedAt: Date,
  ): Promise<void> {
    const query = db.prepare(`
      UPDATE alerts
      SET state = 'ACKNOWLEDGED', acknowledgedAt = ?
      WHERE alertId = ? AND state = 'ACTIVE'
    `);

    query.run(acknowledgedAt.toISOString(), alertId);
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
