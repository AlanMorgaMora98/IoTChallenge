import { devicesAPI } from "@/api/devices.api";
import type { DeviceConfigurationResponse } from "@/types/responses/set-device-configuration.response";

export interface UpdateDeviceConfigPayload {
  minTemp: number;
  maxTemp: number;
  windowMinutes: number;
  intervalSeconds: number;
  minRequiredOkPercentage: number;
}

export const putUpdateDeviceConfigurationAction = async (
  deviceId: string,
  payload: UpdateDeviceConfigPayload,
): Promise<DeviceConfigurationResponse> => {
  const { data } = await devicesAPI.put<DeviceConfigurationResponse>(
    `/${deviceId}/config`,
    payload,
  );

  return data;
};
