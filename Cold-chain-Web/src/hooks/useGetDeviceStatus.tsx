import { useQuery } from "@tanstack/react-query";
import { getDeviceStatusAction } from "@/actions/get-device-status.action"; // Ajusta la ruta

export const useGetDeviceStatus = (deviceId: string | null) => {
  return useQuery({
    queryKey: ["device-status", deviceId],
    queryFn: () => getDeviceStatusAction(deviceId!),
    enabled: !!deviceId,
    refetchOnWindowFocus: false,
  });
};
