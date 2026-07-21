import "dotenv/config"; // Mantenemos la carga limpia por si acaso
import { AzureTwinService } from "../infrastructure/twinDevice/azureTwinDevice";
import { SilenceBuzzerUseCase } from "../application/use-cases/silenceDeviceBuzzer.use-case";

async function runSilenceTest() {
  console.log(
    "\n🧪 --- INICIANDO PRUEBA DE ACCIÓN REMOTA: SILENCIAR BUZZER ---",
  );

  const twinService = new AzureTwinService();
  const silenceBuzzerUseCase = new SilenceBuzzerUseCase(twinService);

  const targetDeviceId = "shipment-alan-morgado";

  try {
    // 3. Ejecutamos la acción directa
    await silenceBuzzerUseCase.execute(targetDeviceId);
    console.log("🏁 --- PRUEBA ACCIÓN FINALIZADA CON ÉXITO EN NODE.JS ---\n");
  } catch (error: any) {
    console.error(
      "❌ Ocurrió un error ejecutando la prueba de silencio:",
      error.message || error,
    );
  }
}

runSilenceTest();
