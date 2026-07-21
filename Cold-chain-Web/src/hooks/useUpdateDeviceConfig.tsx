import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  putUpdateDeviceConfigurationAction,
  type UpdateDeviceConfigPayload,
} from "@/actions/update-device-configuration.action";

interface MutationVariables {
  deviceId: string;
  payload: UpdateDeviceConfigPayload;
}

export const useUpdateDeviceConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deviceId, payload }: MutationVariables) =>
      putUpdateDeviceConfigurationAction(deviceId, payload),
    onSuccess: (_, { deviceId }) => {
      // Invalida la query de la configuración del dispositivo para refrescar datos si es necesario
      queryClient.invalidateQueries({ queryKey: ["device-config", deviceId] });
    },
  });
};
