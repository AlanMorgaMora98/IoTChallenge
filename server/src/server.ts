import "dotenv/config";
import express from "express";
import cors from "cors";

//ROUTES
import { deviceRoutes } from "./infrastructure/api/routes/device.routes";

import { SqliteTelemetryRepository } from "./infrastructure/persistence/sqliteTelemetryRepository";
import { SqliteAlertRepository } from "./infrastructure/persistence/sqliteAlertRepository";
import { SqliteDeviceConfigRepository } from "./infrastructure/persistence/sqliteDeviceConfigRepository";
import { AlertService } from "./application/alertService";
import { AzureIoTHubListener } from "./infrastructure/messaging/azureIoTHubListener";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/iot", deviceRoutes);

const telemetryRepo = new SqliteTelemetryRepository();
const alertRepo = new SqliteAlertRepository();
const configRepo = new SqliteDeviceConfigRepository();

const alertService = new AlertService(telemetryRepo, alertRepo, configRepo);
const iotHubListener = new AzureIoTHubListener(telemetryRepo, alertService);

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(
        `🚀 [Servidor] Backend corriendo en http://localhost:${PORT}`,
      );
    });

    iotHubListener.startListening();
  } catch (error) {
    console.error("Error initialiting server...:", error);
    process.exit(1);
  }
};

process.on("SIGINT", async () => {
  console.log("\n🛑 Apagando el servidor...");
  await iotHubListener.stop();
  process.exit(0);
});

startServer();
