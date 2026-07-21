export interface SuccessResponse {
  success: boolean;
  deviceId: string;
  message: string;
  hardwareStatus: number;
  hardwareResponse: HardwareResponse;
}

export interface HardwareResponse {
  message: string;
  buzzerActiveNow: boolean;
}

export interface ErrorResponse {
  success: boolean;
  message: string;
}

export type SilenceBuzzerReponse = SuccessResponse | ErrorResponse;
