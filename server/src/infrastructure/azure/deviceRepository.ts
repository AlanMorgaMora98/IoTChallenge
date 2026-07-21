import { Registry } from "azure-iothub";
import {
  IDeviceRepository,
  DeviceSummary,
} from "../../domain/repositories/deviceRepository.interface";

export class DeviceRepository implements IDeviceRepository {
  private registry: Registry;

  constructor(connectionString?: string) {
    const connStr = connectionString || process.env.IOTHUB_CONNECTION_STRING;
    if (!connStr) {
      throw new Error("Connection string variable missing");
    }
    this.registry = Registry.fromConnectionString(connStr);
  }

  public async getAllDevices(): Promise<DeviceSummary[]> {
    try {
      const sqlQuery =
        "SELECT deviceId, status, connectionState, lastActivityTime FROM devices";
      const query = this.registry.createQuery(sqlQuery, 100);

      console.log("performing list devices xd");

      const devices: DeviceSummary[] = [];

      while (query.hasMoreResults) {
        // 💡 Envolvemos query.next en una Promesa para poder usar await
        const pageResults = await new Promise<any[]>((resolve, reject) => {
          query.next((err, results) => {
            if (err) return reject(err);
            resolve(results || []);
          });
        });

        // Si la página viene vacía, rompemos el ciclo para evitar loops
        if (!pageResults || pageResults.length === 0) break;

        // pageResults ya es directamente el arreglo de dispositivos
        pageResults.forEach((item: any) => {
          devices.push({
            deviceId: item.deviceId,
            status: item.status,
            connectionState: item.connectionState,
            lastActivityTime: item.lastActivityTime
              ? new Date(item.lastActivityTime)
              : null,
          });
        });
      }

      return devices;
    } catch (error) {
      console.error("Error fetching devices", error);
      throw error;
    }
  }
}
