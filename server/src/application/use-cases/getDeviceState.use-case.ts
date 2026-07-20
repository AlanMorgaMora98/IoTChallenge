import { IDeviceTwinService } from "../../domain/services/deviceTwinService.interface";

export class GetDeviceStateUseCase {
  constructor(private twinService: IDeviceTwinService) {}

  async execute(deviceId: string): Promise<any> {
    if (!deviceId)
      throw new Error("El ID del dispositivo es totalmente requerido.");
    return await this.twinService.getDeviceState(deviceId);
  }
}
