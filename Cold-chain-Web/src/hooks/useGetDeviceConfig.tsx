import { useQuery } from "@tanstack/react-query";
import { getDeviceConfigurationAction } from "@/actions/get-device-configuration.action";

export const useGetDeviceConfiguration = (deviceId: string | null) => {
  return useQuery({
    queryKey: ["device-configuration", deviceId],
    queryFn: () => getDeviceConfigurationAction(deviceId!),
    enabled: !!deviceId,
    refetchOnWindowFocus: false,
  });
};
