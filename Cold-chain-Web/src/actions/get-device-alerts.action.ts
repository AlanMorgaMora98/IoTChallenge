import { devicesAPI } from "@/api/devices.api";
import type { DeviceAlertsResponse } from "@/types/responses/get-device-alerts.response";

export const getDeviceAlertsAction = async (
  deviceId: string,
): Promise<DeviceAlertsResponse> => {
  const { data } = await devicesAPI.get<DeviceAlertsResponse>(
    `/${deviceId}/alerts`,
  );

  if (!data.success) {
    throw new Error("Failed to retrieve device status");
  }

  return data;
};
