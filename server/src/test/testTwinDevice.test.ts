import "dotenv/config";
import { SqliteDeviceConfigRepository } from "../infrastructure/persistence/sqliteDeviceConfigRepository";
import { AzureTwinService } from "../infrastructure/twinDevice/azureTwinDevice";
import { UpdateDeviceConfigUseCase } from "../application/use-cases/updateDeviceConfig.use-case";
import { DeviceConfig } from "../domain/entities";

async function runTest() {
  console.log("\n🧪 --- INICIANDO PRUEBA DE DEVICE TWIN ---");

  console.log("Cadena de texto", process.env.IOTHUB_CONNECTION_STRING);

  // Verificar rápidamente si Node logró leer la variable antes de avanzar
  if (!process.env.IOTHUB_CONNECTION_STRING) {
    console.error(
      "❌ Error previo al test: process.env.IOTHUB_CONNECTION_STRING no se cargó correctamente.",
    );
    return;
  }

  const configRepo = new SqliteDeviceConfigRepository();
  const twinService = new AzureTwinService();

  const useCase = new UpdateDeviceConfigUseCase(configRepo, twinService);

  const testConfig: DeviceConfig = {
    deviceId: "shipment-alan-morgado",
    minTemp: 2,
    maxTemp: 6,
    windowMinutes: 2,
    intervalSeconds: 10,
    minRequiredOkPercentage: 50,
  };

  try {
    // 5. Ejecutar la orquestación limpia
    await useCase.execute(testConfig);
    console.log("🎉 --- PRUEBA FINALIZADA CON ÉXITO EN NODE.JS ---\n");
  } catch (error: any) {
    console.error(
      "❌ Ocurrió un error durante la ejecución de la prueba:",
      error.message || error,
    );
  }
}

// Ejecutar el script
runTest();
