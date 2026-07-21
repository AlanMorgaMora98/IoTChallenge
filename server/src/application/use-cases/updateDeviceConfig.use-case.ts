import { DeviceConfig } from "../../domain/entities";
import { IDeviceConfigRepository } from "../../domain/repositories/deviceConfigRepository.interface";
import { IDeviceTwinService } from "../../domain/services/deviceTwinService.interface";

export class UpdateDeviceConfigUseCase {
  constructor(
    private configRepo: IDeviceConfigRepository,
    private twinService: IDeviceTwinService,
  ) {}

  public async execute(config: DeviceConfig): Promise<void> {
    console.info(
      `[UseCase] Starting configuration update for device: ${config.deviceId}`,
    );

    await this.configRepo.update(config);
    console.info(`[UseCase] Configuration successfully saved.`);

    await this.twinService.updateDesiredProperties(config.deviceId, {
      minTemp: config.minTemp,
      maxTemp: config.maxTemp,
      windowMinutes: config.windowMinutes,
      intervalSeconds: config.intervalSeconds,
      minRequiredOkPercentage: config.minRequiredOkPercentage,
    });
  }
}
