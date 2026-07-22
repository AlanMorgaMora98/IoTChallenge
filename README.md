# IoTChallenge

## 🚀 Getting Started / Execution Instructions

This project consists of three main components: the .NET IoT Agent (`Device/agent`), the Server/API (`server`), and the Web APP (`Cold-chain-Web`).

### Prerequisites

Make sure you have the following installed:
* [.NET 10.0 SDK](https://dotnet.microsoft.com/download) (or higher)
* [Node.js](https://nodejs.org/) (v18 or higher)
* Git

---

### 1. Enviroment variables

### 1.1 Configure the device connection string

Copy the example config and add your device connection string:

```bash
cp agent/appsettings.json.example agent/appsettings.json
```

Edit `agent/appsettings.json` or set the environment variable:

```bash
# PowerShell
$env:IOT_DEVICE_CONNECTION_STRING = "HostName=...;DeviceId=shipment-001;SharedAccessKey=..."

# bash
export IOT_DEVICE_CONNECTION_STRING="HostName=...;DeviceId=shipment-001;SharedAccessKey=..."
```

### 1.2 Configure the device connection string

### 2. Running Services Individually

Open a terminal in the project root directory and follow the steps below for each service:

#### 📱 Device Agent (.NET CLI)

1. Build the agent
```bash
cd Device

dotnet build agent
```

2. Run device project
```bash
dotnet run --project agent -- connect --device-id shipment-001
```

### Server (Node JS)
```bash
cd server/

npm run dev
```

### Web App (React)
```bash
cd Cold-chain-Web/

npm run dev
```
