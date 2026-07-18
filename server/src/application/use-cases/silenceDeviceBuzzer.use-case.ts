import { IDeviceTwinService } from "../../domain/services/deviceTwinService.interface";

export class SilenceBuzzerUseCase {
  constructor(private twinService: IDeviceTwinService) {}

  public async execute(deviceId: string): Promise<void> {
    console.log(
      `🚀 [UseCase] Orquestando comando de silencio de buzzer para: ${deviceId}`,
    );

    if (!deviceId || deviceId.trim() === "") {
      throw new Error(
        "El ID del dispositivo es requerido para ejecutar el comando de silencio.",
      );
    }

    await this.twinService.silenceBuzzer(deviceId);

    console.log(
      `🎉 [UseCase] Comando enviado con éxito al servicio de mensajería para '${deviceId}'.`,
    );
  }
}
