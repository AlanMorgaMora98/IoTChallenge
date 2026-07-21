import { useQuery } from "@tanstack/react-query";
import { getDeviceAlertsAction } from "@/actions/get-device-alerts.action";

export const useGetDeviceAlerts = (deviceId: string | null) => {
  return useQuery({
    queryKey: ["device-alerts", deviceId],
    queryFn: () => getDeviceAlertsAction(deviceId!),
    enabled: !!deviceId,
    refetchOnWindowFocus: false,
  });
};
