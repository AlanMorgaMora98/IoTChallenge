import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

//ROUTES
import { deviceRoutes } from "./infrastructure/api/routes/device.routes";

import { SqliteTelemetryRepository } from "./infrastructure/persistence/sqliteTelemetryRepository";
import { SqliteAlertRepository } from "./infrastructure/persistence/sqliteAlertRepository";
import { SqliteDeviceConfigRepository } from "./infrastructure/persistence/sqliteDeviceConfigRepository";
import { AlertService } from "./application/alertService";
import { AzureIoTHubListener } from "./infrastructure/messaging/azureIoTHubListener";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.use("/iot", deviceRoutes);

io.on("connection", (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

const telemetryRepo = new SqliteTelemetryRepository();
const alertRepo = new SqliteAlertRepository();
const configRepo = new SqliteDeviceConfigRepository();

const alertService = new AlertService(telemetryRepo, alertRepo, configRepo);
const iotHubListener = new AzureIoTHubListener(telemetryRepo, alertService, io);

const startServer = async () => {
  try {
    httpServer.listen(PORT, () => {
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
  console.log("\n🛑 Shutting down server...");
  await iotHubListener.stop();
  process.exit(0);
});

startServer();
