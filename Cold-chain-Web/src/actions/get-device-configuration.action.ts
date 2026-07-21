import { devicesAPI } from "@/api/devices.api";
import type { DeviceConfigurationResponse } from "@/types/responses/get-device-configuration.response";

export const getDeviceConfigurationAction = async (
  deviceId: string,
): Promise<DeviceConfigurationResponse> => {
  const { data } = await devicesAPI.get<DeviceConfigurationResponse>(
    `/${deviceId}/config`,
  );

  if (!data.success) {
    throw new Error("Failed to retrieve device status");
  }

  return data;
};
