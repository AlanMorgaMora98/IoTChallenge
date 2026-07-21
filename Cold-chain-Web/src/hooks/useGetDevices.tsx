import { useQuery } from "@tanstack/react-query";
import { fetchDevicesListAction } from "@/actions/get-list-devices.action";
import type { Device } from "@/types/responses/get-list-devices.response";

export const useGetDevices = () => {
  return useQuery<Device[], Error>({
    queryKey: ["iot-devices"],
    queryFn: fetchDevicesListAction,
    refetchInterval: 1000 * 60,
    refetchOnWindowFocus: false,
  });
};
