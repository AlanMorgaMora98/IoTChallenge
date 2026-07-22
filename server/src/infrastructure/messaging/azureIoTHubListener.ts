import {
  EventHubConsumerClient,
  //earliestEventPosition,
  latestEventPosition,
  ReceivedEventData,
} from "@azure/event-hubs";
import { Server } from "socket.io";
import { ITelemetryRepository } from "../../domain/repositories/telemetryRepository.interface";
import { AlertService } from "../../application/alertService";
import { TelemetryReading } from "../../domain/entities";

export class AzureIoTHubListener {
  private client: EventHubConsumerClient;
  private subscription: any;

  private activeBuzzers: Set<string> = new Set();

  constructor(
    private telemetryRepo: ITelemetryRepository,
    private alertService: AlertService,
    private io: Server,
  ) {
    const connectionString =
      process.env.IOTHUB_EVENT_HUBS_CONNECTION_STRING || "";

    if (!connectionString) {
      console.warn(
        "[IoT Hub] Not founded: IOTHUB_EVENT_HUBS_CONNECTION_STRING not defined in .env",
      );
    }

    const consumerGroup = "$Default";

    this.client = new EventHubConsumerClient(consumerGroup, connectionString);

    this.io.on("connection", (socket) => {
      socket.emit(
        "device:initial_active_buzzers",
        Array.from(this.activeBuzzers),
      );
    });
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
                  '[IoT Hub] empty meesage "iothub-connection-device-id".',
                );
                continue;
              }

              const payload: TelemetryReading =
                typeof event.body === "string"
                  ? JSON.parse(event.body)
                  : event.body;

              console.log(`[IoT Hub] message from '${deviceId}':`);
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

              console.log("Saving telemetry...");
              await this.telemetryRepo.save(reading);
              await this.alertService.processNewTelemetry(reading);

              if (reading.buzzerActive) {
                console.log(
                  `⚠️ [Socket.io] New alert to socket: ${reading.deviceId}`,
                );

                this.activeBuzzers.add(reading.deviceId);

                this.io.emit("device:buzzer_alert", {
                  deviceId: reading.deviceId,
                  buzzerActive: true,
                  temperatureC: reading.temperatureC,
                  timestamp: reading.timestamp,
                });
              } else {
                if (this.activeBuzzers.has(reading.deviceId)) {
                  this.activeBuzzers.delete(reading.deviceId);

                  this.io.emit("device:buzzer_alert", {
                    deviceId: reading.deviceId,
                    buzzerActive: false,
                  });
                }
              }
            } catch (error) {
              console.error(
                "❌ [Azure IoT Hub] Error handling message:",
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
    console.log("[Azure IoT Hub] Closing...");
    if (this.subscription) {
      await this.subscription.close();
    }
    await this.client.close();
    console.log("[Azure IoT Hub] CLOSED.");
  }
}
