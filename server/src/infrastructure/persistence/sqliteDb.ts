import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "cold_chain.db");
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deviceId TEXT NOT NULL,
    temperatureC REAL NOT NULL,
    humidityPct REAL NOT NULL,
    buzzerActive INTEGER NOT NULL,
    sequenceNumber INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(deviceId, sequenceNumber, timestamp)
  )
`,
).run();

db.prepare(
  `
  CREATE INDEX IF NOT EXISTS idx_telemetry_device_timestamp 
  ON telemetry (deviceId, timestamp DESC);
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS alerts (
    alertId INTEGER PRIMARY KEY AUTOINCREMENT,
    deviceId TEXT NOT NULL,
    state TEXT NOT NULL CHECK(state IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')),
    triggerValue REAL NOT NULL,
    startedAt TEXT NOT NULL,
    acknowledgedAt TEXT NULL,
    resolvedAt TEXT NULL,
    createdAt TEXT NOT NULL
  )
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS device_configs (
    deviceId TEXT PRIMARY KEY,
    minTemp REAL NOT NULL,
    maxTemp REAL NOT NULL,
    windowMinutes INTEGER NOT NULL,
    intervalSeconds INTEGER NOT NULL,
    minRequiredOkPercentage REAL NOT NULL
  )
`,
).run();

db.prepare(
  `
  CREATE INDEX IF NOT EXISTS idx_telemetry_device_timestamp 
  ON telemetry (deviceId, timestamp DESC);
`,
).run();

db.prepare(
  `
  CREATE INDEX IF NOT EXISTS idx_alerts_device_state 
  ON alerts (deviceId, state);
`,
).run();

try {
  const checkConfig = db.prepare(
    `SELECT COUNT(*) as count FROM device_configs`,
  );
  const result = checkConfig.get() as { count: number };

  if (result.count === 0) {
    const insertConfig = db.prepare(`
      INSERT INTO device_configs 
      (deviceId, minTemp, maxTemp, windowMinutes, intervalSeconds, minRequiredOkPercentage)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertConfig.run(
      "shipment-alan-morgado", // deviceId
      5.0, // tempMin
      8.0, // tempMax
      3, // windowMinutes
      15, // intervalSeconds
      75.0, // minRequiredOkPercentage
    );

    console.log(`Initial config for 'shipment-alan-morgado'.`);
  }
} catch (error) {
  console.error("Error on SQLite script:", error);
}

console.log(`Success creating DB`);
