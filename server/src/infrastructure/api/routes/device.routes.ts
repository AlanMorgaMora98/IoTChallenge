import { Router } from "express";
import { AzureTwinService } from "../../twinDevice/azureTwinDevice";
import { SilenceBuzzerUseCase } from "../../../application/use-cases/silenceDeviceBuzzer.use-case";
import { UpdateDeviceConfigUseCase } from "../../../application/use-cases/updateDeviceConfig.use-case";
import { GetDeviceStateUseCase } from "../../../application/use-cases/getDeviceState.use-case";
import { SqliteDeviceConfigRepository } from "../../persistence/sqliteDeviceConfigRepository";
import { DeviceController } from "../controllers/device.controller";

const router = Router();

const configRepo = new SqliteDeviceConfigRepository();
const twinService = new AzureTwinService();

const silenceBuzzerUseCase = new SilenceBuzzerUseCase(twinService);
const updateDeviceConfigUseCase = new UpdateDeviceConfigUseCase(
  configRepo,
  twinService,
);
const getDeviceStateUseCase = new GetDeviceStateUseCase(twinService);

//CONTROLLER
const deviceController = new DeviceController(
  silenceBuzzerUseCase,
  updateDeviceConfigUseCase,
  getDeviceStateUseCase,
);

router.post(
  "/devices/:deviceId/buzzer/silence",
  deviceController.silenceBuzzer,
);
router.put("/devices/:deviceId/config", deviceController.updateConfiguration);
router.get("/devices/:deviceId/state", deviceController.getLiveState);

export { router as deviceRoutes };
