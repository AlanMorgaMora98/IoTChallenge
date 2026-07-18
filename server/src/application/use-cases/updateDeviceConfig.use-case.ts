import { DeviceConfig } from "../../domain/entities";
import { IDeviceConfigRepository } from "../../domain/repositories/deviceConfigRepository.interface";
import { IDeviceTwinService } from "../../domain/services/deviceTwinService.interface";

export class UpdateDeviceConfigUseCase {
  constructor(
    private configRepo: IDeviceConfigRepository,
    private twinService: IDeviceTwinService,
  ) {}

  public async execute(config: DeviceConfig): Promise<void> {
    console.log(
      `🚀 [UseCase] Iniciando actualización de configuración para el dispositivo: ${config.deviceId}`,
    );

    await this.configRepo.update(config);
    console.log(
      `💾 [UseCase] Configuración guardada con éxito en SQLite de forma local.`,
    );

    await this.twinService.updateDesiredProperties(config.deviceId, {
      minTemp: config.minTemp,
      maxTemp: config.maxTemp,
      windowMinutes: config.windowMinutes,
      intervalSeconds: config.intervalSeconds,
      minRequiredOkPercentage: config.minRequiredOkPercentage,
    });

    console.log(
      `✨ [UseCase] Proceso de sincronización completado para el dispositivo: ${config.deviceId}`,
    );
  }
}
