export interface ListDevicesResponse {
  success: boolean;
  count: number;
  data: Device[];
}

export interface Device {
  deviceId: string;
  status: Status;
  connectionState: ConnectionState;
  lastActivityTime: Date | null;
}

export type ConnectionState = "Connected" | "Disconnected";

export type Status = "Enabled" | "Disabled" | "enabled" | "disabled";
