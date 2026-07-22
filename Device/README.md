# Cold Chain Monitor — IoT Take-Home Exercise

## Overview

**Acme Logistics** ships temperature-sensitive pharmaceuticals. Each shipment has a tracker device (the provided agent). Operations needs:

1. **Alerts** when temperature exceeds a threshold for **sustained** periods (not a single spike).
2. **Visibility** into which device/shipment is in alarm and when it started.
3. **Operator action**: a dispatcher can **acknowledge** an alert and **silence the device buzzer** remotely.
4. **Config**: temperature threshold adjustable per device without redeploying the agent.

### What you are given

A **C# device agent** that connects to Azure IoT Hub and sends uplink telemetry. Run it from the command line.

### What you must build

Everything on the **server/cloud side** — ingestion, alert rules, persistence, operator interface, and **downlink** to silence the buzzer and push configuration changes.

**You choose** the language, framework, hosting (local Azure Function, ASP.NET API, Node service, etc.), storage, and UI (CLI, web, Swagger — your call). We do not prescribe a stack.

### Time guidance

Plan for roughly **4–6 hours** of focused work. You will have a few days to complete and submit.

---



## Prerequisites

- Azure IoT Hub **device** and **service** connection strings (can be provided on request)
- Any additional tools required by the server stack you choose

---



## Getting started with the agent



### 1. Configure the device connection string

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

**Do not commit connection strings or secrets to Git.**

### 2. Build the agent

```bash
dotnet build agent
```



### 3. Verify uplink in Azure Portal (optional)

Run the agent (see CLI below), then open your IoT Hub in the Azure Portal → **Devices** → select your device → **Device twin** / message monitoring to confirm telemetry arrives.

---



## Agent CLI reference

```bash
# Connect and send telemetry every 30 seconds (Ctrl+C to stop)
dotnet run --project agent -- connect --device-id shipment-001

# Custom interval
dotnet run --project agent -- connect --device-id shipment-001 --interval-seconds 15

# Send a single telemetry message
dotnet run --project agent -- send --device-id shipment-001 --temperature 8.4

# Simulate a high-temperature event (several readings)
dotnet run --project agent -- simulate-alarm --device-id shipment-001 --cycles 5

# Show local device state
dotnet run --project agent -- status
```

Run `dotnet run --project agent -- --help` for full option details.

---



## Telemetry contract

The agent sends JSON messages like:

```json
{
  "deviceId": "shipment-tracker-001",
  "temperatureC": 8.4,
  "humidityPct": 62,
  "buzzerActive": false,
  "sequenceNumber": 42,
  "timestamp": "2026-07-09T14:30:00Z"
}
```

The agent sets `buzzerActive` locally when it believes the temperature threshold has been exceeded. Your server should evaluate its **own** alert rules from the telemetry stream — do not assume the agent is the sole source of truth for operational alerts.

---



## Downlink and configuration (your responsibility)

The agent **receives** cloud-to-device messages and device twin updates but **does not fully act on them** today. Your server implementation should send downlink using Azure IoT Hub so that a device can be silenced and configured remotely.

Expected capabilities (implement the server; extend the agent if you need to):


| Mechanism                          | Example payload                                           | Intended effect                                       |
| ---------------------------------- | --------------------------------------------------------- | ----------------------------------------------------- |
| **Cloud-to-device message**        | `{ "command": "silence_buzzer", "correlationId": "..." }` | Device stops buzzing; confirm in subsequent telemetry |
| **Device twin desired properties** | `{ "temperatureThresholdC": 6.0 }`                        | Device applies a new threshold without redeployment   |


You may also use **direct methods** if you prefer — document your contract in `DESIGN.md`.

> **Note:** Real IoT systems often behave unexpectedly at the edges (offline devices, duplicate messages, mismatched timestamps). If the agent does something surprising during testing, treat it as part of the exercise — document what you found and how your server handles it.

---



## Deliverables

Submit the following:

1. `DESIGN.md` — architecture diagram, component choices, trade-offs, failure modes, security considerations.
2. **Working server implementation** — runnable from your repo with clear instructions (`README` section or `SERVER.md`).
3. **Demo notes** (or a short screen recording) showing: uplink → alert raised → operator acknowledges → downlink silence.
4. **Public Git repository** containing your full solution. Share the URL with us.



### Repository expectations

- Create a **public** repo on GitHub, GitLab, or Bitbucket.
- Include the provided agent (fork or copy) plus your server code.
- Use `.example` files for configuration — **no secrets in the repo**.
- Meaningful commit history is appreciated (e.g. design → ingestion → alerts → downlink).

---



## Suggested workflow

1. Read this brief and explore the agent code.
2. Write `DESIGN.md` before or in parallel with implementation.
3. Confirm telemetry reaches your IoT Hub via the agent.
4. Build ingestion from IoT Hub into your server.
5. Implement alert rules (sustained threshold, not single spike).
6. Add operator visibility and acknowledge flow.
7. Implement downlink (silence + threshold config).
8. Test with `simulate-alarm` and normal `connect` loop.
9. Push to your public repo and send us the link.

---



## Questions?

If anything in the brief is ambiguous, document your assumptions in `DESIGN.md` and proceed. Part of the exercise is making reasonable IoT architecture decisions without every detail spelled out.

Connection strings and IoT Hub access can be provided on request.