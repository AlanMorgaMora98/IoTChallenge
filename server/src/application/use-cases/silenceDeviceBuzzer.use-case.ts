import { IDeviceTwinService } from "../../domain/services/deviceTwinService.interface";

export class SilenceBuzzerUseCase {
  constructor(private twinService: IDeviceTwinService) {}

  // public async execute(deviceId: string): Promise<void> {
  //   console.info(
  //     `[UseCase] Sending buzzer silence command to device: ${deviceId}`,
  //   );

  //   if (!deviceId || deviceId.trim() === "") {
  //     throw new Error("The device ID is required to perform");
  //   }

  //   await this.twinService.silenceBuzzer(deviceId);

  //   console.info(
  //     `[UseCase] Command successfully sent to the messaging service for device '${deviceId}`,
  //   );
  // }

  async execute(deviceId: string): Promise<any> {
    if (!deviceId) throw new Error("ID device required.");
    return await this.twinService.silenceBuzzer(deviceId);
  }
}
