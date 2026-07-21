import { useMutation } from "@tanstack/react-query";
import { setSilenceBuzzerAction } from "@/actions/device-silence.action";
import type { SilenceBuzzerReponse } from "@/types/responses/set-silence-buzzer.response";

export const useSilenceBuzzer = () => {
  return useMutation<SilenceBuzzerReponse, Error, string>({
    mutationFn: (deviceId: string) => setSilenceBuzzerAction(deviceId),
  });
};
