import { IDeviceTwinService } from "../../domain/services/deviceTwinService.interface";

export class SilenceBuzzerUseCase {
  constructor(private twinService: IDeviceTwinService) {}

  async execute(deviceId: string): Promise<any> {
    if (!deviceId) throw new Error("ID device required.");
    return await this.twinService.silenceBuzzer(deviceId);
  }
}
