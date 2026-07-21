import { IAlertRepository } from "../../domain/repositories/alertRepositiory.interface";
import { Alert } from "../../domain/entities";

export class GetDeviceAlertsUseCase {
  constructor(private alertsRepo: IAlertRepository) {}

  public async execute(deviceId: string): Promise<Alert[] | null> {
    console.info(`[UseCase] Fetching device alerts: ${deviceId}`);

    const alerts = await this.alertsRepo.findAllByDevice(deviceId);

    console.info(`[UseCase] Result from Repo:`, alerts);

    return alerts;
  }
}
