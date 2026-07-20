import { Registry, Client } from "azure-iothub";
import { IDeviceTwinService } from "../../domain/services/deviceTwinService.interface";

export class AzureTwinService implements IDeviceTwinService {
  private registry: Registry;
  private serviceClient: Client;

  constructor() {
    const connectionString = process.env.IOTHUB_CONNECTION_STRING || "";

    if (!connectionString) {
      console.warn("provide your IOTHUB_CONNECTION_STRING to connect");
    }

    this.registry = Registry.fromConnectionString(connectionString);
    this.serviceClient = Client.fromConnectionString(connectionString);
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
        `[Twin] Connecting to Azure to update the device twin for '${deviceId}'...`,
      );

      const response = await this.registry.getTwin(deviceId);
      const twin = response.responseBody;
      const twinPatch = {
        properties: {
          desired: {
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
        `✅ [Twin] Desired properties applied to device:'${deviceId}'.`,
      );
    } catch (error: any) {
      console.error(
        `❌ [Twin] Error updating the device twin for '${deviceId}':`,
        error.message || error,
      );
      throw error;
    }
  }

  // public async silenceBuzzer(deviceId: string): Promise<void> {
  //   try {
  //     console.log(`🌐 [Twin] Silencing buzzer...: ${deviceId}...`);

  //     const response = await this.registry.getTwin(deviceId);
  //     const twin = response.responseBody;

  //     const patch = {
  //       properties: {
  //         desired: {
  //           buzzerEnabled: false,
  //         },
  //       },
  //     };

  //     await this.registry.updateTwin(deviceId, patch, twin.etag);
  //     console.log(`✅ [Twin] Succesful `);
  //   } catch (error: any) {
  //     console.error(
  //       `❌ [Twin] Error al intentar silenciar el buzzer:`,
  //       error.message,
  //     );
  //     throw error;
  //   }
  // }

  public async silenceBuzzer(deviceId: string): Promise<any> {
    console.log(`🌐 [Twin] Silencing buzzer...: ${deviceId}...`);

    const methodParams = {
      methodName: "silenceBuzzer",
      payload: { action: "force_silence", requestedBy: "backend_api" },
      responseTimeoutInSeconds: 15,
    };

    return new Promise((resolve, reject) => {
      this.serviceClient.invokeDeviceMethod(
        deviceId,
        methodParams,
        (err: any, result: any) => {
          if (err) {
            console.error(
              `❌ [Direct method] ERROR  on Direct Method 'silenceBuzzer':`,
              err.message,
            );
            return reject(err);
          }

          console.log(
            `✅ [Direct method] Immediate hardware response received.`,
          );
          resolve(result);
        },
      );
    });
  }

  public async getDeviceState(deviceId: string): Promise<any> {
    console.log(
      `🌐 [Direct Method] Performing 'getDeviceState' on: ${deviceId}`,
    );

    const methodParams = {
      methodName: "getDeviceState",
      payload: {},
      responseTimeoutInSeconds: 30,
    };

    return new Promise((resolve, reject) => {
      this.serviceClient.invokeDeviceMethod(
        deviceId,
        methodParams,
        (err: any, result: any) => {
          if (err) {
            console.error(
              `❌ [Direct Method] Something went wrong with direct method'getDeviceState':`,
              err.message,
            );
            return reject(err);
          }
          resolve(result);
        },
      );
    });
  }
}
