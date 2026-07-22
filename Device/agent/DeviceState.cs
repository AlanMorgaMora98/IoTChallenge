namespace ColdChain.Agent;

public sealed class DeviceState
{
    public bool AlarmAcknowledged { get; set; } = false;
    public string HubDeviceId { get; private set; } = "shipment-test-alan";
    public double MinTempC { get; set; } = 2.0;
    public double MaxTempC { get; set; } = 8.0;
    public int WindowMinutes { get; set; } = 5;
    public int IntervalSeconds { get; set; } = 5;
    public double MinRequiredOkPercentage { get; set; } = 0.80;
    public double LastTemperatureC { get; set; } = 5.0;
    public double LastHumidityPct { get; set; } = 55.0;
    public bool BuzzerActive { get; set; }
    public long SequenceNumber { get; private set; }
    public bool SimulateAlarmActive { get; set; }
    public int SimulateAlarmCyclesRemaining { get; set; }
    public DateTime? LastSentUtc { get; set; }
    public bool IsConnected { get; set; }

    private readonly Queue<double> _temperatureHistory = new();
    private readonly object _sync = new();

    private int _totalCycleSamples;

    private double _maxAllowedBadSamples;

    public void Configure(string hubDeviceId)
    {
        HubDeviceId = hubDeviceId;
    }

    public void ApplyConfiguration(double minTempC, double maxTempC, int windowMinutes, int intervalSeconds, double minRequiredOkPercentage)
    {
        lock (_sync)
        {
            MinTempC = minTempC;
            MaxTempC = maxTempC;
            WindowMinutes = Math.Max(1, windowMinutes);
            IntervalSeconds = Math.Max(1, intervalSeconds);
            MinRequiredOkPercentage = Math.Clamp(minRequiredOkPercentage, 0.0, 1.0);

            _totalCycleSamples = (WindowMinutes * 60) / IntervalSeconds;
            _totalCycleSamples = Math.Max(5, _totalCycleSamples);

            double minRequiredOkSamples = _totalCycleSamples * MinRequiredOkPercentage;
            _maxAllowedBadSamples = _totalCycleSamples - minRequiredOkSamples;

            _temperatureHistory.Clear();
        }
    }

    public long NextSequence()
    {
        lock (_sync)
        {
            SequenceNumber++;
            return SequenceNumber;
        }
    }

    private void PushToWindow(double currentTemp)
    {
        _temperatureHistory.Enqueue(currentTemp);
        while (_temperatureHistory.Count > _totalCycleSamples)
        {
            _temperatureHistory.Dequeue();
        }
    }

    public void EvaluateBuzzer()
    {
        int badSamplesCount = 0;

        lock (_sync)
        {
            foreach (var temp in _temperatureHistory)
            {
                if (temp < MinTempC || temp > MaxTempC)
                {
                    badSamplesCount++;
                }
            }
        }

        bool isThermalViolation = badSamplesCount > _maxAllowedBadSamples;

        bool isInsideDangerZone = (SimulateAlarmActive && SimulateAlarmCyclesRemaining > 0) || isThermalViolation;

        if (isInsideDangerZone)
        {
            BuzzerActive = !AlarmAcknowledged;
        }
        else
        {
            BuzzerActive = false;
            AlarmAcknowledged = false;
        }
    }

    public void AfterTelemetrySent()
    {
        if (SimulateAlarmActive && SimulateAlarmCyclesRemaining > 0)
        {
            SimulateAlarmCyclesRemaining--;
            if (SimulateAlarmCyclesRemaining <= 0)
            {
                SimulateAlarmActive = false;
            }
        }
    }

    public TelemetryMessage BuildTelemetry()
    {
        lock (_sync)
        {
            PushToWindow(LastTemperatureC);
        }

        EvaluateBuzzer();

        return new TelemetryMessage
        {
            DeviceId = "shipment-test-alan",
            TemperatureC = Math.Round(LastTemperatureC, 1),
            HumidityPct = Math.Round(LastHumidityPct, 1),
            BuzzerActive = BuzzerActive,
            SequenceNumber = SequenceNumber,
            Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss") + "Z"
        };
    }

    public void PrintStatus()
    {
        Console.WriteLine($"Hub device id     : {HubDeviceId}");
        Console.WriteLine($"Payload device id : shipment-test-alan");
        Console.WriteLine($"Temperature       : {LastTemperatureC:F1} C");
        Console.WriteLine($"Humidity          : {LastHumidityPct:F1} %");
        Console.WriteLine($"Min temp          : {MinTempC:F1} C");
        Console.WriteLine($"Max temp          : {MaxTempC:F1} C");
        Console.WriteLine($"Window            : {WindowMinutes} min");
        Console.WriteLine($"Interval          : {IntervalSeconds} sec");
        Console.WriteLine($"Min ok pct        : {MinRequiredOkPercentage:P0}");
        Console.WriteLine($"Buzzer active     : {BuzzerActive}");
        Console.WriteLine($"Sequence number   : {SequenceNumber}");
        Console.WriteLine($"Connected         : {IsConnected}");
        Console.WriteLine($"Last sent         : {LastSentUtc?.ToString("u") ?? "(never)"}");
        Console.WriteLine($"Simulate alarm    : {SimulateAlarmActive} ({SimulateAlarmCyclesRemaining} cycles left)");
    }
}