import { Request, Response } from "express";
import { SilenceBuzzerUseCase } from "../../../application/use-cases/silenceDeviceBuzzer.use-case";
import { UpdateDeviceConfigUseCase } from "../../../application/use-cases/updateDeviceConfig.use-case";
import { GetDeviceStateUseCase } from "../../../application/use-cases/getDeviceState.use-case";
import { GetDevicesUseCase } from "../../../application/use-cases/getDevicesList.use-case";
import { GetDeviceConfigUseCase } from "../../../application/use-cases/getDeviceConfiguration.use-case";
import { GetDeviceAlertsUseCase } from "../../../application/use-cases/getDeviceAlerts.use-case";

export class DeviceController {
  constructor(
    private silenceBuzzerUseCase: SilenceBuzzerUseCase,
    private updateConfigUseCase: UpdateDeviceConfigUseCase,
    private getDeviceStateUseCase: GetDeviceStateUseCase,
    private getDevicesUseCase: GetDevicesUseCase,
    private getDeviceConfigUseCase: GetDeviceConfigUseCase,
    private getDeviceAlertsUseCase: GetDeviceAlertsUseCase,
  ) {}

  public silenceBuzzer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceId } = req.params;

      const result = await this.silenceBuzzerUseCase.execute(
        deviceId as string,
      );

      res.status(200).json({
        success: true,
        deviceId,
        message: "Buzzer silenced succesfully",
        hardwareStatus: result.status,
        hardwareResponse: result.payload,
      });
    } catch (error: any) {
      console.error(
        "Error on DeviceController (silenceBuzzer):",
        error.message,
      );
      res.status(504).json({
        success: false,
        message:
          "The device could not be silenced immediately because it is offline.",
      });
    }
  };

  public updateConfiguration = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { deviceId } = req.params;

      const {
        minTemp,
        maxTemp,
        windowMinutes,
        intervalSeconds,
        minRequiredOkPercentage,
      } = req.body;

      if (typeof deviceId !== "string") {
        res.status(400).json({
          success: false,
          message: "invalid ID",
        });
        return;
      }

      await this.updateConfigUseCase.execute({
        deviceId,
        minTemp: Number(minTemp),
        maxTemp: Number(maxTemp),
        windowMinutes: Number(windowMinutes),
        intervalSeconds: Number(intervalSeconds),
        minRequiredOkPercentage: Number(minRequiredOkPercentage),
      });

      res.status(200).json({
        success: true,
        message: `Configuration for device ${deviceId} has been saved and synchronized successfully.`,
      });
    } catch (error: any) {
      console.error("Error on DeviceController (updateConfig):", error.message);
      res.status(500).json({
        success: false,
        message: error.message || "Error processing the configuration update.",
      });
    }
  };

  public getLiveState = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceId } = req.params;

      const result = await this.getDeviceStateUseCase.execute(
        deviceId as string,
      );

      res.status(200).json({
        success: true,
        deviceId,
        status: result.status,
        liveData: result.payload,
      });
    } catch (error: any) {
      console.error(
        "❌ Error on DeviceController (getLiveState):",
        error.message,
      );
      res.status(504).json({
        success: false,
        message: "The hardware did not respond in time or is disconnected.",
      });
    }
  };

  public getDevices = async (_req: Request, res: Response): Promise<void> => {
    try {
      const devices = await this.getDevicesUseCase.execute();
      //console.log(devices);
      res.json({
        success: true,
        count: devices.length,
        data: devices,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error fetching devices list",
        error: error.message,
      });
    }
  };

  public getDeviceConfiguration = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { deviceId } = req.params;

      const deviceConfiguration = await this.getDeviceConfigUseCase.execute(
        deviceId as string,
      );
      res.json({
        success: true,
        deviceConfiguration,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error fetching devices list",
        error: error.message,
      });
    }
  };

  public getDeviceAlerts = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { deviceId } = req.params;

      const deviceAlerts = await this.getDeviceAlertsUseCase.execute(
        deviceId as string,
      );
      res.json({
        success: true,
        deviceAlerts,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error fetching devices alerts",
        error: error.message,
      });
    }
  };
}
