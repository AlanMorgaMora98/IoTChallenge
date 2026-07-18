import { Registry } from "azure-iothub";
import { IDeviceTwinService } from "../../domain/services/deviceTwinService.interface";

export class AzureTwinService implements IDeviceTwinService {
  private registry: Registry;

  constructor() {
    const connectionString =
      process.env.IOTHUB_EVENTHUB_CONNECTION_STRING || "";

    if (!connectionString) {
      console.warn("provide your IOTHUB_EVENTHUB_CONNECTION_STRING to connect");
    }

    this.registry = Registry.fromConnectionString(connectionString);
  }

  public async updateDesiredProperties(
    deviceId: string,
    config: {
      minTemp: number;
      maxTemp: number;
      windowMinutes: number;
      intervalSeconds: number;
      minRequiredOkPercentage: number;
    },
  ): Promise<void> {
    try {
      console.log(
        `🌐 [Azure Twin] Conectando con Azure para actualizar el Twin de '${deviceId}'...`,
      );

      // 3. Obtener el Twin actual del dispositivo desde Azure
      const response = await this.registry.getTwin(deviceId);
      const twin = response.responseBody;

      // 4. Estructurar el parche de propiedades deseadas (desired properties)
      const twinPatch = {
        properties: {
          desired: {
            // Guardamos las reglas dentro de un objeto legible para el emulador C#
            thermostatRules: {
              minTemp: config.minTemp,
              maxTemp: config.maxTemp,
              windowMinutes: config.windowMinutes,
              intervalSeconds: config.intervalSeconds,
              minRequiredOkPercentage: config.minRequiredOkPercentage,
              updatedAt: new Date().toISOString(),
            },
          },
        },
      };

      await this.registry.updateTwin(deviceId, twinPatch, twin.etag);

      console.log(
        `✅ [Azure Twin] Desired properties applied to device:'${deviceId}'.`,
      );
    } catch (error: any) {
      console.error(
        `❌ [Azure Twin] Error al intentar actualizar el Device Twin de '${deviceId}':`,
        error.message || error,
      );
      throw error;
    }
  }

  public async silenceBuzzer(deviceId: string): Promise<void> {
    try {
      console.log(`🌐 [Azure Twin] Silencing buzzer...: ${deviceId}...`);

      const response = await this.registry.getTwin(deviceId);
      const twin = response.responseBody;

      const patch = {
        properties: {
          desired: {
            buzzerEnabled: true,
          },
        },
      };

      await this.registry.updateTwin(deviceId, patch, twin.etag);
      console.log(
        `✅ [Azure Twin] Orden de silenciar buzzer enviada con éxito.`,
      );
    } catch (error: any) {
      console.error(
        `❌ [Azure Twin] Error al intentar silenciar el buzzer:`,
        error.message,
      );
      throw error;
    }
  }
}
