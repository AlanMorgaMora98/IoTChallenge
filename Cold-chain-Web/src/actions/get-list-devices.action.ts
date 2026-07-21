import { devicesAPI } from "@/api/devices.api"; // Ajusta la ruta a tu cliente de axios
import type {
  ListDevicesResponse,
  Device,
} from "@/types/responses/get-list-devices.response";

export const fetchDevicesListAction = async (): Promise<Device[]> => {
  const { data } = await devicesAPI.get<ListDevicesResponse>("");
  console.log(data);
  return data.data;
};
