import { devicesAPI } from "@/api/devices.api";
import type {
  DeviceStatusReponse,
  SuccessResponse,
} from "@/types/responses/get-device-status.response";

export const getDeviceStatusAction = async (
  deviceId: string,
): Promise<SuccessResponse> => {
  const { data } = await devicesAPI.get<DeviceStatusReponse>(
    `/${deviceId}/state`,
  );

  if (!data.success) {
    throw new Error(data.message || "Failed to retrieve device status");
  }

  return data;
};
