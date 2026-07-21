import { IDeviceConfigRepository } from "../../domain/repositories/deviceConfigRepository.interface";
import { DeviceConfig } from "../../domain/entities/deviceConfig.entity";

export class GetDeviceConfigUseCase {
  constructor(private configRepo: IDeviceConfigRepository) {}

  public async execute(deviceId: string): Promise<DeviceConfig | null> {
    console.info(`[UseCase] Fetching configuration for device: ${deviceId}`);

    const config = await this.configRepo.getByDeviceId(deviceId);

    console.info(`[UseCase] Result from Repo:`, config);

    return config;
  }
}
