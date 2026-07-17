import express from "express";
import dotenv from "dotenv";
import { TelemetryProcessor } from "../application/telemetryProcessor";
import { EventHubConsumer } from "./azure/eventHubConsumer";
import { MemoryAlertRepository } from "./persistence/memoryAlertRepository"; // <- Nuevo

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const AZURE_CONN_STRING =
  process.env.EVENTHUB_COMPATIBLE_CONNECTION_STRING || "";
const EVENT_HUB_NAME =
  process.env.EVENTHUB_COMPATIBLE_NAME || "messages/events";

// 1. Inicializamos la persistencia (Infraestructura)
const alertRepository = new MemoryAlertRepository();

// 2. Inicializamos el Procesador (Aplicación) inyectándole el repositorio
const telemetryProcessor = new TelemetryProcessor(alertRepository);

// 3. Inicializamos el Consumidor de Azure Event Hubs (Infraestructura)
const consumer = new EventHubConsumer(
  AZURE_CONN_STRING,
  EVENT_HUB_NAME,
  telemetryProcessor,
);
consumer.start();

// --- Endpoints del Operador (¡Podemos meterlos aquí directo para probar!) ---

// Obtener todas las alertas para la interfaz del operador
app.get("/api/alerts", async (req, res) => {
  const alerts = await alertRepository.findAll();
  res.json(alerts);
});

app.get("/health", (req, res) => {
  res.json({ status: "RUNNING", time: new Date() });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor de Cold Chain corriendo en el puerto ${PORT}`);
});

const gracefulShutdown = async () => {
  console.log("\nApagando...");
  server.close(async () => {
    await consumer.stop();
    process.exit(0);
  });
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
