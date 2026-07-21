import {
  IDeviceRepository,
  DeviceSummary,
} from "../../domain/repositories/deviceRepository.interface";

export class GetDevicesUseCase {
  constructor(private deviceRepo: IDeviceRepository) {}

  public async execute(): Promise<DeviceSummary[]> {
    return await this.deviceRepo.getAllDevices();
  }
}
