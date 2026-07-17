import {
  EventHubConsumerClient,
  //earliestEventPosition,
  latestEventPosition,
  ReceivedEventData,
} from "@azure/event-hubs";
import { ITelemetryRepository } from "../../domain/repositories/telemetryRepository.interface";
import { AlertService } from "../../application/alertService";
import { TelemetryReading } from "../../domain/entities";

export class AzureIoTHubListener {
  private client: EventHubConsumerClient;
  private subscription: any;

  constructor(
    private telemetryRepo: ITelemetryRepository,
    private alertService: AlertService,
  ) {
    const connectionString =
      process.env.IOTHUB_EVENT_HUBS_CONNECTION_STRING || "";

    if (!connectionString) {
      console.warn(
        "⚠️ [Azure IoT Hub] Advertencia: IOTHUB_EVENT_HUBS_CONNECTION_STRING not defined in .env",
      );
    }

    this.alertService;

    const consumerGroup = "$Default";

    this.client = new EventHubConsumerClient(consumerGroup, connectionString);
  }

  public startListening(): void {
    this.subscription = this.client.subscribe(
      {
        processEvents: async (events: ReceivedEventData[], _context) => {
          if (events.length === 0) return;

          for (const event of events) {
            try {
              const deviceId = event.systemProperties?.[
                "iothub-connection-device-id"
              ] as string;

              if (!deviceId) {
                console.warn(
                  '⚠️ [Azure IoT Hub] Recibido mensaje sin metadatos de "iothub-connection-device-id". Se ignora.',
                );
                continue;
              }

              const payload: TelemetryReading =
                typeof event.body === "string"
                  ? JSON.parse(event.body)
                  : event.body;

              console.log(
                `📥 [Azure IoT Hub] Mensaje recibido de '${deviceId}':`,
              );
              console.log(
                `   └─ Temp: ${payload.temperatureC}°C | Hum: ${payload.humidityPct}% | Buzzer: ${payload.buzzerActive} | Seq: ${payload.sequenceNumber} | DATETIME | ${payload.timestamp}`,
              );
              const deviceTimestamp = payload.timestamp
                ? new Date(payload.timestamp)
                : event.enqueuedTimeUtc
                  ? new Date(event.enqueuedTimeUtc)
                  : new Date();

              const reading: TelemetryReading = {
                deviceId,
                temperatureC: Number(payload.temperatureC),
                humidityPct: Number(payload.humidityPct),
                buzzerActive: !!payload.buzzerActive,
                sequenceNumber: Number(payload.sequenceNumber ?? 0),
                timestamp: deviceTimestamp,
              };

              console.log("GUARDANDO LA TELEMETRIA");
              await this.telemetryRepo.save(reading);

              // 6. Ejecutar el motor de alertas con la regla de sensibilidad
              await this.alertService.processNewTelemetry(reading);
            } catch (error) {
              console.error(
                "❌ [Azure IoT Hub] Error al procesar un evento de telemetría individual:",
                error,
              );
            }
          }
        },
        processError: async (err, _context) => {
          console.error("Error connecting to Event Hubs:", err.message);
        },
      },
      {
        startPosition: latestEventPosition, // earliestEventPosition,
      },
    );
  }

  public async stop(): Promise<void> {
    console.log("🔌 [Azure IoT Hub] Closing...");
    if (this.subscription) {
      await this.subscription.close();
    }
    await this.client.close();
    console.log("✔ [Azure IoT Hub] CLOSED.");
  }
}
