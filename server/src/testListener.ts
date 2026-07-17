import "dotenv/config";
import {
  EventHubConsumerClient,
  //earliestEventPosition,
  latestEventPosition,
} from "@azure/event-hubs";

async function main() {
  const connectionString = process.env.IOTHUB_EVENTHUB_CONNECTION_STRING;

  if (!connectionString) {
    console.error("Missing IOTHUB_EVENTHUB_CONNECTION_STRING in .env");
    process.exit(1);
  }

  const consumerGroup = "$Default";
  const client = new EventHubConsumerClient(consumerGroup, connectionString);

  console.log("Starting Event Hub listener...");

  const subscription = client.subscribe(
    {
      processEvents: async (events, _context) => {
        for (const event of events) {
          const deviceId =
            event.systemProperties?.["iothub-connection-device-id"];
          console.log("--- Telemetry received ---");
          console.log("Device (real identity):", deviceId);
          console.log("Secuence number:", event.sequenceNumber);
          console.log("Body:", event.body);
          console.log("Enqueued at:", event.enqueuedTimeUtc);
        }
      },
      processError: async (err, context) => {
        console.error(
          `Error on partition ${context.partitionId}:`,
          err.message,
        );
      },
    },
    { startPosition: latestEventPosition },
  );

  console.log("Listening... (Ctrl+C to stop)");

  process.on("SIGINT", async () => {
    console.log("\nShutting down...");
    await subscription.close();
    await client.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
