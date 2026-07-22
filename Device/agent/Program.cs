using System.CommandLine;
using ColdChain.Agent;
using Microsoft.Extensions.Configuration;

var configuration = new ConfigurationBuilder()
    .SetBasePath(AppContext.BaseDirectory)
    .AddJsonFile("appsettings.json", optional: true)
    .AddEnvironmentVariables()
    .Build();

var connectionString = configuration["IOT_DEVICE_CONNECTION_STRING"]
    ?? Environment.GetEnvironmentVariable("IOT_DEVICE_CONNECTION_STRING");

var state = new DeviceState();
var downlink = new DownlinkHandler(state);

var root = new RootCommand("Cold Chain device agent for Azure IoT Hub");

var deviceIdOption = new Option<string>("--device-id")
{
    Description = "IoT Hub registered device identity",
    DefaultValueFactory = _ => "shipment-001"
};

var intervalOption = new Option<int>("--interval-seconds")
{
    Description = "Telemetry interval when connected",
    DefaultValueFactory = _ => 5
};

var temperatureOption = new Option<double>("--temperature")
{
    Description = "Temperature in Celsius for a single telemetry message",
    DefaultValueFactory = _ => 5.0
};

var cyclesOption = new Option<int>("--cycles")
{
    Description = "Number of high-temperature readings to send",
    DefaultValueFactory = _ => 5
};

var connectCommand = new Command("connect", "Connect to IoT Hub and send telemetry on an interval");
connectCommand.Options.Add(deviceIdOption);
connectCommand.Options.Add(intervalOption);
connectCommand.SetAction(async (parseResult, cancellationToken) =>
{
    if (!TryResolveConnectionString(out var resolved))
    {
        return 1;
    }

    state.Configure(parseResult.GetValue(deviceIdOption)!);
    state.IntervalSeconds = parseResult.GetValue(intervalOption);
    await using var host = new DeviceClientHost(state, downlink, resolved);

    Console.CancelKeyPress += (_, eventArgs) =>
    {
        eventArgs.Cancel = true;
    };

    try
    {
        await host.RunTelemetryLoopAsync(cancellationToken);
    }
    catch (OperationCanceledException)
    {
        Console.WriteLine("Stopped.");
    }

    return 0;
});

var sendCommand = new Command("send", "Send a single telemetry message");
sendCommand.Options.Add(deviceIdOption);
sendCommand.Options.Add(temperatureOption);
sendCommand.SetAction(async (parseResult, cancellationToken) =>
{
    if (!TryResolveConnectionString(out var resolved))
    {
        return 1;
    }

    state.Configure(parseResult.GetValue(deviceIdOption)!);
    state.LastTemperatureC = parseResult.GetValue(temperatureOption);
    state.LastHumidityPct = 60;

    await using var host = new DeviceClientHost(state, downlink, resolved);
    await host.ConnectAsync(cancellationToken);
    await host.SendTelemetryAsync(advanceSequence: true, cancellationToken);
    return 0;
});

var simulateAlarmCommand = new Command("simulate-alarm", "Send several high-temperature readings");
simulateAlarmCommand.Options.Add(deviceIdOption);
simulateAlarmCommand.Options.Add(cyclesOption);
simulateAlarmCommand.SetAction(async (parseResult, cancellationToken) =>
{
    if (!TryResolveConnectionString(out var resolved))
    {
        return 1;
    }

    state.Configure(parseResult.GetValue(deviceIdOption)!);
    await using var host = new DeviceClientHost(state, downlink, resolved);
    await host.SimulateAlarmAsync(parseResult.GetValue(cyclesOption), cancellationToken);
    return 0;
});

var statusCommand = new Command("status", "Show current local device state");
statusCommand.SetAction((_, _) =>
{
    state.PrintStatus();
    return Task.FromResult(0);
});

root.Subcommands.Add(connectCommand);
root.Subcommands.Add(sendCommand);
root.Subcommands.Add(simulateAlarmCommand);
root.Subcommands.Add(statusCommand);

return await root.Parse(args).InvokeAsync();

bool TryResolveConnectionString(out string resolved)
{
    resolved = connectionString ?? string.Empty;
    if (!string.IsNullOrWhiteSpace(resolved))
    {
        return true;
    }

    Console.Error.WriteLine("Missing device connection string.");
    Console.Error.WriteLine("Set IOT_DEVICE_CONNECTION_STRING in appsettings.json or the environment.");
    return false;
}
