import { IDeviceTwinService } from "../../domain/services/deviceTwinService.interface";
import { IAlertRepository } from "../../domain/repositories/alertRepositiory.interface";

export class SilenceBuzzerUseCase {
  constructor(
    private twinService: IDeviceTwinService,
    private alertRepository: IAlertRepository,
  ) {}

  async execute(deviceId: string): Promise<any> {
    if (!deviceId) throw new Error("ID device required.");
    const result = await this.twinService.silenceBuzzer(deviceId);

    const updatedAlert =
      await this.alertRepository.acknowledgeByDeviceId(deviceId);
    return {
      result,
      acknowledgedAlert: updatedAlert,
    };
  }
}
