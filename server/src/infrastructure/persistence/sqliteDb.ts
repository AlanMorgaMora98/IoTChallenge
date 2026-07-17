import Database from "better-sqlite3";
import path from "path";

// Creamos o abrimos el archivo local de SQLite en la raíz del proyecto
const dbPath = path.resolve(process.cwd(), "cold_chain.db");
export const db = new Database(dbPath);

// Configuramos SQLite para máxima velocidad en escrituras (Modo WAL)
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

// 1. Inicializamos la tabla de telemetría si no existe
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

// 2. Creamos el Índice Compuesto para búsquedas ultra rápidas por dispositivo y tiempo
db.prepare(
  `
  CREATE INDEX IF NOT EXISTS idx_telemetry_device_timestamp 
  ON telemetry (deviceId, timestamp DESC);
`,
).run();

console.log(`💾 Base de datos SQLite inicializada exitosamente.`);
console.log(`📍 Archivo de BD: ${dbPath}`);
console.log(
  `⚡ Índice compuesto 'idx_telemetry_device_timestamp' configurado.`,
);
