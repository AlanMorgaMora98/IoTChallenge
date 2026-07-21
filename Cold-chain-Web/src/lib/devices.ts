export type DeviceStatus = "online" | "offline" | "maintenance";
export type DeviceAlert = "none" | "warning" | "critical";

export interface DeviceReading {
  label: string;
  value: string;
  time: string;
}

export interface Device {
  id: string;
  name: string;
  status: DeviceStatus;
  alert: DeviceAlert;
  type: string;
  location: string;
  ipAddress: string;
  firmware: string;
  lastSeen: string;
  uptime: string;
  battery: number;
  readings: DeviceReading[];
}

export const devices: Device[] = [
  {
    id: "DEV-001",
    name: "Sensor Temperatura A1",
    status: "online",
    alert: "none",
    type: "Sensor de temperatura",
    location: "Planta 1 - Zona Norte",
    ipAddress: "192.168.1.101",
    firmware: "v2.4.1",
    lastSeen: "Hace 2 minutos",
    uptime: "14 días, 6 horas",
    battery: 87,
    readings: [
      { label: "Temperatura", value: "23.4 °C", time: "Hace 2 minutos" },
      { label: "Temperatura", value: "23.1 °C", time: "Hace 12 minutos" },
      { label: "Temperatura", value: "22.9 °C", time: "Hace 22 minutos" },
    ],
  },
  {
    id: "DEV-002",
    name: "Gateway Principal",
    status: "online",
    alert: "warning",
    type: "Gateway LoRaWAN",
    location: "Planta 1 - Sala de servidores",
    ipAddress: "192.168.1.102",
    firmware: "v3.1.0",
    lastSeen: "Hace 1 minuto",
    uptime: "45 días, 12 horas",
    battery: 100,
    readings: [
      {
        label: "Paquetes recibidos",
        value: "1,248/min",
        time: "Hace 1 minuto",
      },
      { label: "Latencia media", value: "84 ms", time: "Hace 6 minutos" },
      { label: "Nodos conectados", value: "37", time: "Hace 11 minutos" },
    ],
  },
  {
    id: "DEV-003",
    name: "Sensor Humedad B2",
    status: "offline",
    alert: "critical",
    type: "Sensor de humedad",
    location: "Planta 2 - Almacén",
    ipAddress: "192.168.1.103",
    firmware: "v2.3.8",
    lastSeen: "Hace 3 horas",
    uptime: "0 días, 0 horas",
    battery: 12,
    readings: [
      { label: "Humedad", value: "71 %", time: "Hace 3 horas" },
      { label: "Humedad", value: "69 %", time: "Hace 3.5 horas" },
      { label: "Humedad", value: "68 %", time: "Hace 4 horas" },
    ],
  },
  {
    id: "DEV-004",
    name: "Actuador Válvula C1",
    status: "maintenance",
    alert: "none",
    type: "Actuador",
    location: "Planta 1 - Zona Sur",
    ipAddress: "192.168.1.104",
    firmware: "v1.9.2",
    lastSeen: "Hace 30 minutos",
    uptime: "2 días, 4 horas",
    battery: 64,
    readings: [
      {
        label: "Posición válvula",
        value: "45 % abierta",
        time: "Hace 30 minutos",
      },
      { label: "Ciclos totales", value: "12,480", time: "Hace 45 minutos" },
      { label: "Presión de línea", value: "3.2 bar", time: "Hace 1 hora" },
    ],
  },
  {
    id: "DEV-005",
    name: "Cámara Perimetral D3",
    status: "online",
    alert: "none",
    type: "Cámara IP",
    location: "Exterior - Entrada principal",
    ipAddress: "192.168.1.105",
    firmware: "v4.0.3",
    lastSeen: "Hace 1 minuto",
    uptime: "30 días, 18 horas",
    battery: 100,
    readings: [
      {
        label: "Detecciones de movimiento",
        value: "3 eventos",
        time: "Hace 1 minuto",
      },
      { label: "Bitrate de video", value: "4.2 Mbps", time: "Hace 5 minutos" },
      { label: "Almacenamiento usado", value: "72 %", time: "Hace 15 minutos" },
    ],
  },
  {
    id: "DEV-006",
    name: "Sensor Vibración E1",
    status: "online",
    alert: "warning",
    type: "Sensor de vibración",
    location: "Planta 2 - Línea de producción",
    ipAddress: "192.168.1.106",
    firmware: "v2.4.1",
    lastSeen: "Hace 5 minutos",
    uptime: "8 días, 2 horas",
    battery: 45,
    readings: [
      { label: "Vibración RMS", value: "4.8 mm/s", time: "Hace 5 minutos" },
      { label: "Vibración RMS", value: "4.6 mm/s", time: "Hace 15 minutos" },
      {
        label: "Temperatura rodamiento",
        value: "58 °C",
        time: "Hace 25 minutos",
      },
    ],
  },
  {
    id: "DEV-007",
    name: "Medidor Energía F2",
    status: "offline",
    alert: "critical",
    type: "Medidor de energía",
    location: "Planta 1 - Cuadro eléctrico",
    ipAddress: "192.168.1.107",
    firmware: "v3.0.5",
    lastSeen: "Hace 1 día",
    uptime: "0 días, 0 horas",
    battery: 0,
    readings: [
      { label: "Consumo", value: "48.2 kWh", time: "Hace 1 día" },
      { label: "Tensión L1", value: "231 V", time: "Hace 1 día" },
      { label: "Factor de potencia", value: "0.94", time: "Hace 1 día" },
    ],
  },
  {
    id: "DEV-008",
    name: "Sensor CO2 G1",
    status: "online",
    alert: "none",
    type: "Sensor de calidad de aire",
    location: "Oficinas - Piso 2",
    ipAddress: "192.168.1.108",
    firmware: "v2.5.0",
    lastSeen: "Hace 4 minutos",
    uptime: "21 días, 9 horas",
    battery: 92,
    readings: [
      { label: "CO2", value: "612 ppm", time: "Hace 4 minutos" },
      { label: "CO2", value: "598 ppm", time: "Hace 14 minutos" },
      { label: "Calidad del aire", value: "Buena", time: "Hace 24 minutos" },
    ],
  },
];
