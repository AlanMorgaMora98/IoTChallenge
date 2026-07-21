import { Router } from "express";
import { AzureTwinService } from "../../twinDevice/azureTwinDevice";
import { SilenceBuzzerUseCase } from "../../../application/use-cases/silenceDeviceBuzzer.use-case";
import { UpdateDeviceConfigUseCase } from "../../../application/use-cases/updateDeviceConfig.use-case";
import { GetDeviceStateUseCase } from "../../../application/use-cases/getDeviceState.use-case";
import { GetDevicesUseCase } from "../../../application/use-cases/getDevicesList.use-case";
import { SqliteDeviceConfigRepository } from "../../persistence/sqliteDeviceConfigRepository";
import { DeviceRepository } from "../../azure/deviceRepository";
import { DeviceController } from "../controllers/device.controller";
import { GetDeviceConfigUseCase } from "../../../application/use-cases/getDeviceConfiguration.use-case";
import { SqliteAlertRepository } from "../../persistence/sqliteAlertRepository";
import { GetDeviceAlertsUseCase } from "../../../application/use-cases/getDeviceAlerts.use-case";

const router = Router();

const configRepo = new SqliteDeviceConfigRepository();
const twinService = new AzureTwinService();
const deviceRepository = new DeviceRepository();
const alertRepository = new SqliteAlertRepository();

const silenceBuzzerUseCase = new SilenceBuzzerUseCase(
  twinService,
  alertRepository,
);
const updateDeviceConfigUseCase = new UpdateDeviceConfigUseCase(
  configRepo,
  twinService,
);
const getDeviceStateUseCase = new GetDeviceStateUseCase(twinService);

const getDevicesListUseCase = new GetDevicesUseCase(deviceRepository);

const getDeviceConfigUseCase = new GetDeviceConfigUseCase(configRepo);

const getDeviceAlertsUseCase = new GetDeviceAlertsUseCase(alertRepository);

//CONTROLLER
const deviceController = new DeviceController(
  silenceBuzzerUseCase,
  updateDeviceConfigUseCase,
  getDeviceStateUseCase,
  getDevicesListUseCase,
  getDeviceConfigUseCase,
  getDeviceAlertsUseCase,
);

router.post(
  "/devices/:deviceId/buzzer/silence",
  deviceController.silenceBuzzer,
);
router.put("/devices/:deviceId/config", deviceController.updateConfiguration);
router.get(
  "/devices/:deviceId/config",
  deviceController.getDeviceConfiguration,
);
router.get("/devices/:deviceId/state", deviceController.getLiveState);
router.get("/devices", deviceController.getDevices);
router.get("/devices/:deviceId/alerts", deviceController.getDeviceAlerts);

export { router as deviceRoutes };
