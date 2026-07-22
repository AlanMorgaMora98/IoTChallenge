using System.Text;
using System.Text.Json;
using Microsoft.Azure.Devices.Client;

namespace ColdChain.Agent;

public sealed class DeviceClientHost : IAsyncDisposable
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = false };

    private readonly DeviceState _state;
    private readonly DownlinkHandler _downlink;
    private readonly string _connectionString;
    private readonly List<TelemetryMessage> _offlineBuffer = new();
    private DeviceClient? _client;

    public DeviceClientHost(DeviceState state, DownlinkHandler downlink, string connectionString)
    {
        _state = state;
        _downlink = downlink;
        _connectionString = connectionString;
    }

    public async Task ConnectAsync(CancellationToken cancellationToken)
    {
        _client = DeviceClient.CreateFromConnectionString(_connectionString, TransportType.Mqtt);
        await _client.OpenAsync(cancellationToken);

        await _client.SetReceiveMessageHandlerAsync(_downlink.HandleCloudToDeviceMessageAsync, null);
        await _downlink.InitializeTwinAtStartupAsync(_client, cancellationToken);

        // Register direct method handler to provide current device measurements on demand
        await _client.SetMethodHandlerAsync("getDeviceState", HandleGetDeviceStateMethodAsync, null);

        // Direct method to silence buzzer remotely
        await _client.SetMethodHandlerAsync("silenceBuzzer", HandleSilenceBuzzerMethodAsync, null);

        _state.IsConnected = true;
        Console.WriteLine($"Connected to IoT Hub as '{_state.HubDeviceId}'.");

        await FlushOfflineBufferAsync(cancellationToken);
    }

    public async Task SendTelemetryAsync(bool advanceSequence, CancellationToken cancellationToken)
    {
        if (_client is null)
        {
            throw new InvalidOperationException("Device is not connected. Run the connect command first.");
        }

        if (advanceSequence)
        {
            _ = _state.NextSequence();
        }

        var telemetry = _state.BuildTelemetry();
        await TrySendAsync(telemetry, cancellationToken);
        _state.AfterTelemetrySent();
    }

    public async Task RunTelemetryLoopAsync(CancellationToken cancellationToken)
    {
        await ConnectAsync(cancellationToken);

        await SendTelemetryAsync(advanceSequence: true, cancellationToken);

        while (!cancellationToken.IsCancellationRequested)
        {
            var delaySeconds = Math.Max(1, _state.IntervalSeconds);
            await Task.Delay(TimeSpan.FromSeconds(delaySeconds), cancellationToken);

            if (!_state.SimulateAlarmActive)
            {
                var min = Math.Min(_state.MinTempC, _state.MaxTempC);
                var max = Math.Max(_state.MinTempC, _state.MaxTempC);
                var span = Math.Max(0.0, max - min);
                _state.LastTemperatureC = min + Random.Shared.NextDouble() * span;
                _state.LastHumidityPct = 58 + Random.Shared.NextDouble() * 8;
            }

            await SendTelemetryAsync(advanceSequence: true, cancellationToken);
        }
    }

    public async Task SimulateAlarmAsync(int cycles, CancellationToken cancellationToken)
    {
        if (_client is null)
        {
            await ConnectAsync(cancellationToken);
        }

        _state.SimulateAlarmActive = true;
        _state.SimulateAlarmCyclesRemaining = cycles;

        for (var i = 0; i < cycles; i++)
        {
            _state.LastTemperatureC = _state.MaxTempC + 4 + Random.Shared.NextDouble() * 3;
            _state.LastHumidityPct = 70 + Random.Shared.NextDouble() * 5;
            await SendTelemetryAsync(advanceSequence: true, cancellationToken);
            await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken);
        }
    }

    private async Task TrySendAsync(TelemetryMessage telemetry, CancellationToken cancellationToken)
    {
        if (_client is null)
        {
            _offlineBuffer.Add(telemetry);
            return;
        }

        try
        {
            var payload = JsonSerializer.Serialize(telemetry, JsonOptions);
            using var message = new Message(Encoding.UTF8.GetBytes(payload));
            message.ContentType = "application/json";
            message.ContentEncoding = "utf-8";

            await _client.SendEventAsync(message, cancellationToken);
            _state.LastSentUtc = DateTime.UtcNow;
            Console.WriteLine($"[uplink] seq={telemetry.SequenceNumber} temp={telemetry.TemperatureC}C buzzer={telemetry.BuzzerActive}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[uplink] Send failed ({ex.Message}). Buffering message seq={telemetry.SequenceNumber}.");
            _offlineBuffer.Add(telemetry);
            _state.IsConnected = false;
        }
    }

    private async Task FlushOfflineBufferAsync(CancellationToken cancellationToken)
    {
        if (_offlineBuffer.Count == 0)
        {
            return;
        }

        Console.WriteLine($"[uplink] Replaying {_offlineBuffer.Count} buffered message(s)...");
        var pending = _offlineBuffer.ToList();
        _offlineBuffer.Clear();

        foreach (var telemetry in pending)
        {
            await TrySendAsync(telemetry, cancellationToken);
        }

        _state.IsConnected = true;
    }

    // Direct method handler: returns current measurements/state as JSON payload
    private async Task<MethodResponse> HandleGetDeviceStateMethodAsync(MethodRequest request, object userContext)
    {
        try
        {
            // Build a snapshot of current telemetry/state
            _state.EvaluateBuzzer(); // ensure BuzzerActive is current
            var snapshot = _state.BuildTelemetry();

            // You may want to include extra state fields; expand as needed:
            var responseObj = new
            {
                deviceId = snapshot.DeviceId,
                temperatureC = snapshot.TemperatureC,
                humidityPct = snapshot.HumidityPct,
                buzzerActive = snapshot.BuzzerActive,
                sequenceNumber = snapshot.SequenceNumber,
                timestamp = snapshot.Timestamp,
                // include applied configuration for completeness
                config = new
                {
                    minTemp = _state.MinTempC,
                    maxTemp = _state.MaxTempC,
                    windowMinutes = _state.WindowMinutes,
                    intervalSeconds = _state.IntervalSeconds,
                    minRequiredOkPercentage = _state.MinRequiredOkPercentage,
                }
            };

            var payload = JsonSerializer.Serialize(responseObj, JsonOptions);
            var payloadBytes = Encoding.UTF8.GetBytes(payload);
            Console.WriteLine("[Method] getDeviceState invoked - returning current measurements.");
            return new MethodResponse(payloadBytes, 200);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Method] getDeviceState failed: {ex.Message}");
            var err = JsonSerializer.Serialize(new { error = ex.Message });
            return new MethodResponse(Encoding.UTF8.GetBytes(err), 500);
        }
    }

    private Task<MethodResponse> HandleSilenceBuzzerMethodAsync(MethodRequest request, object userContext)
    {
        try
        {
            Console.WriteLine("\n[Method] Silencing buzzer...");

            _state.AlarmAcknowledged = true;
            _state.EvaluateBuzzer();

            var responseObj = new
            {
                message = "Buzzer silenced.",
                buzzerActiveNow = _state.BuzzerActive
            };

            var payload = JsonSerializer.Serialize(responseObj, JsonOptions);
            var payloadBytes = Encoding.UTF8.GetBytes(payload);

            return Task.FromResult(new MethodResponse(payloadBytes, 200));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Method] silenceBuzzer failed: {ex.Message}");
            var err = JsonSerializer.Serialize(new { error = ex.Message });
            return Task.FromResult(new MethodResponse(Encoding.UTF8.GetBytes(err), 500));
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_client is not null)
        {
            await _client.CloseAsync();
            _client.Dispose();
        }
    }
}
