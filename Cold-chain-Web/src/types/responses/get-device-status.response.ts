export interface SuccessResponse {
  success: true;
  deviceId: string;
  status: number;
  liveData: LiveData;
}

export interface LiveData {
  deviceId: string;
  temperatureC: number;
  humidityPct: number;
  buzzerActive: boolean;
  sequenceNumber: number;
  timestamp: Date | string;
  config: DeviceConfig;
}

export interface DeviceConfig {
  minTemp: number;
  maxTemp: number;
  windowMinutes: number;
  intervalSeconds: number;
  minRequiredOkPercentage: number;
}

export interface ErrorResponse {
  success: false;
  message: string;
}

export type DeviceStatusReponse = SuccessResponse | ErrorResponse;
