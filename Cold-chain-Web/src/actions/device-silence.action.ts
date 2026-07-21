import { devicesAPI } from "@/api/devices.api";
import type { SilenceBuzzerReponse } from "@/types/responses/set-silence-buzzer.response";

export const setSilenceBuzzerAction = async (
  deviceId: string,
): Promise<SilenceBuzzerReponse> => {
  const { data } = await devicesAPI.post<SilenceBuzzerReponse>(
    `/${deviceId}/buzzer/silence`,
  );

  if (!data.success) {
    throw new Error("Failed to retrieve device status");
  }

  return data;
};
