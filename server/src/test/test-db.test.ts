import { SqliteTelemetryRepository } from "./infrastructure/persistence/sqliteTelemetryRepository";
import { TelemetryReading } from "./domain/entities/index";

async function runTest() {
  console.log("🚀 Iniciando prueba de persistencia SQLite...");
  const repository = new SqliteTelemetryRepository();
  const mockDeviceId = "sensor-camion-01";

  // Creamos lecturas de prueba
  const reading1: TelemetryReading = {
    deviceId: mockDeviceId,
    temperatureC: 5.4,
    humidityPct: 62.1,
    buzzerActive: false,
    sequenceNumber: 101,
    timestamp: new Date(),
  };

  // Intentamos un duplicado (mismo sequenceNumber y timestamp) pero con temperatura diferente
  const readingDuplicated: TelemetryReading = {
    ...reading1,
    temperatureC: 99.9,
  };

  try {
    console.log("\n📥 Guardando lectura 1...");
    await repository.save(reading1);

    console.log(
      "📥 Intentando guardar un duplicado exacto de red (debe ser ignorado)...",
    );
    await repository.save(readingDuplicated);

    console.log("\n🔍 Consultando la base de datos...");
    const history = await repository.getRecentReadings(mockDeviceId, 10);

    console.log(`\n📊 Registros en BD: ${history.length} (Debe ser 1, no 2)`);
    console.log(JSON.stringify(history, null, 2));

    if (history.length === 1 && history[0].temperatureC !== 99.9) {
      console.log("\n✅ ¡PRUEBA CON BASE DE DATOS EXITOSA! SQLite está listo.");
    } else {
      console.log("\n❌ Algo no cuadra con el filtro de duplicados.");
    }
  } catch (err) {
    console.error("❌ Error ejecutando prueba:", err);
  }
}

runTest();
