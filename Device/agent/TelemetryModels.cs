using System.Text.Json.Serialization;

namespace ColdChain.Agent;

public sealed class TelemetryMessage
{
    [JsonPropertyName("deviceId")]
    public string DeviceId { get; set; } = string.Empty;

    [JsonPropertyName("temperatureC")]
    public double TemperatureC { get; set; }

    [JsonPropertyName("humidityPct")]
    public double HumidityPct { get; set; }

    [JsonPropertyName("buzzerActive")]
    public bool BuzzerActive { get; set; }

    [JsonPropertyName("sequenceNumber")]
    public long SequenceNumber { get; set; }

    [JsonPropertyName("timestamp")]
    public string Timestamp { get; set; } = string.Empty;
}

public sealed class DownlinkCommand
{
    [JsonPropertyName("command")]
    public string? Command { get; set; }

    [JsonPropertyName("correlationId")]
    public string? CorrelationId { get; set; }
}
