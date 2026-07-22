using System.Text;
using System.Text.Json;
using Newtonsoft.Json.Linq;
using Microsoft.Azure.Devices.Client;
using Microsoft.Azure.Devices.Shared;

namespace ColdChain.Agent;

public sealed class DownlinkHandler
{
    private readonly DeviceState _state;
    private DeviceClient? _client;

    public DownlinkHandler(DeviceState state)
    {
        _state = state;
    }

    public async Task InitializeTwinAtStartupAsync(DeviceClient client, CancellationToken cancellationToken)
    {
        _client = client;
        await _client.SetDesiredPropertyUpdateCallbackAsync(HandleDesiredPropertiesChangedAsync, null);

        var twin = await _client.GetTwinAsync(cancellationToken);
        await ApplyDesiredPropertiesAsync(twin.Properties.Desired);
    }

    public Task<MessageResponse> HandleCloudToDeviceMessageAsync(Message message, object _)
    {
        var body = Encoding.UTF8.GetString(message.GetBytes());
        Console.WriteLine($"[downlink] Cloud-to-device message received: {body}");
        return Task.FromResult(MessageResponse.Completed);
    }

    private async Task HandleDesiredPropertiesChangedAsync(TwinCollection desired, object _)
    {
        Console.WriteLine("[twin] Desired properties updated (callback)");
        await ApplyDesiredPropertiesAsync(desired);
    }

    private async Task ApplyDesiredPropertiesAsync(TwinCollection? desired)
    {
        if (desired is null)
        {
            Console.WriteLine("[twin] Desired is null.");
            return;
        }

        // Normalise to a TwinCollection that contains our configuration keys.
        TwinCollection? config = null;

        // common expected names - use non-conflicting locals and explicit casts
        if (desired.Contains("config"))
        {
            var obj = desired["config"];
            if (obj is TwinCollection tcObj)
            {
                config = tcObj;
            }
            else if (obj is JObject cj)
            {
                var temp = new TwinCollection();
                foreach (var p in cj.Properties()) temp[p.Name] = p.Value.ToObject<object>();
                config = temp;
            }
        }

        if (config is null && desired.Contains("thermostatRules"))
        {
            var obj = desired["thermostatRules"];
            if (obj is TwinCollection trObj)
            {
                config = trObj;
            }
            else if (obj is JObject trj)
            {
                var temp = new TwinCollection();
                foreach (var p in trj.Properties()) temp[p.Name] = p.Value.ToObject<object>();
                config = temp;
            }
        }

        if (config is null && (desired.Contains("minTemp") || desired.Contains("maxTemp")))
        {
            // values are directly on desired
            config = desired;
        }

        if (config is null)
        {
            // scan for a nested object that contains our keys (robust for varying twin shapes)
            foreach (var pairObj in desired)
            {
                if (pairObj is KeyValuePair<string, object> kv && kv.Value is TwinCollection child && (child.Contains("minTemp") || child.Contains("maxTemp")))
                {
                    config = child;
                    break;
                }
                // older SDKs may enumerate as DictionaryEntry or other shapes
                if (pairObj is System.Collections.DictionaryEntry de && de.Value is TwinCollection child2 && (child2.Contains("minTemp") || child2.Contains("maxTemp")))
                {
                    config = child2;
                    break;
                }
                // also handle JObject children
                if (pairObj is KeyValuePair<string, object> kv2 && kv2.Value is JObject childJ && (childJ["minTemp"] is not null || childJ["maxTemp"] is not null))
                {
                    var temp = new TwinCollection();
                    foreach (var p in childJ.Properties()) temp[p.Name] = p.Value.ToObject<object>();
                    config = temp;
                    break;
                }
            }
        }

        if (config is null)
        {
            // Fallback: try to parse the serialized JSON to find nested objects (handles unexpected TwinCollection shapes)
            try
            {
                var json = desired.ToJson();
                var root = JObject.Parse(json);
                if (root.TryGetValue("config", out var cfgToken) && cfgToken is JObject cfgObj)
                {
                    var tc = new TwinCollection();
                    foreach (var p in cfgObj.Properties()) tc[p.Name] = p.Value.ToObject<object>();
                    config = tc;
                }
                else if (root.TryGetValue("thermostatRules", out var trToken) && trToken is JObject trObj)
                {
                    var tc = new TwinCollection();
                    foreach (var p in trObj.Properties()) tc[p.Name] = p.Value.ToObject<object>();
                    config = tc;
                }
            }
            catch
            {
                // ignore parse errors
            }

            if (config is null)
            {
                Console.WriteLine("[twin] No 'config' found in desired properties.");
                return;
            }
        }

        object? rawVal;

        // helper to parse double/int from different possible underlying types (JsonElement, string, number)
        static double? ParseDouble(object? raw)
        {
            if (raw is null) return null;
            if (raw is double d) return d;
            if (raw is float f) return Convert.ToDouble(f);
            if (raw is int i) return Convert.ToDouble(i);
            if (raw is long l) return Convert.ToDouble(l);
            if (raw is string s && double.TryParse(s, out var sd)) return sd;
            if (raw is JsonElement je)
            {
                try
                {
                    if (je.ValueKind == JsonValueKind.Number)
                    {
                        return je.GetDouble();
                    }
                    if (je.ValueKind == JsonValueKind.String && double.TryParse(je.GetString(), out var r))
                    {
                        return r;
                    }
                }
                catch { }
            }
            try
            {
                return Convert.ToDouble(raw);
            }
            catch { return null; }
        }

        static int? ParseInt(object? raw)
        {
            if (raw is null) return null;
            if (raw is int i) return i;
            if (raw is long l) return Convert.ToInt32(l);
            if (raw is double d) return Convert.ToInt32(d);
            if (raw is string s && int.TryParse(s, out var si)) return si;
            if (raw is JsonElement je)
            {
                try
                {
                    if (je.ValueKind == JsonValueKind.Number)
                    {
                        if (je.TryGetInt32(out var vi)) return vi;
                        return Convert.ToInt32(je.GetDouble());
                    }
                    if (je.ValueKind == JsonValueKind.String && int.TryParse(je.GetString(), out var r)) return r;
                }
                catch { }
            }
            try
            {
                return Convert.ToInt32(raw);
            }
            catch { return null; }
        }

        double minTemp = _state.MinTempC;
        double maxTemp = _state.MaxTempC;
        int windowMinutes = _state.WindowMinutes;
        int intervalSeconds = _state.IntervalSeconds;
        double minRequiredOkPercentage = _state.MinRequiredOkPercentage;

        // Only process config if it exists
        if (config is not null)
        {
            if (config.Contains("minTemp"))
            {
                rawVal = config["minTemp"];
                var pd = ParseDouble(rawVal);
                if (pd.HasValue) minTemp = pd.Value;
                else Console.WriteLine($"[twin] Could not parse minTemp '{rawVal}' - keeping {_state.MinTempC}");
            }

            if (config.Contains("maxTemp"))
            {
                rawVal = config["maxTemp"];
                var pd = ParseDouble(rawVal);
                if (pd.HasValue) maxTemp = pd.Value;
                else Console.WriteLine($"[twin] Could not parse maxTemp '{rawVal}' - keeping {_state.MaxTempC}");
            }

            if (config.Contains("windowMinutes"))
            {
                rawVal = config["windowMinutes"];
                var pi = ParseInt(rawVal);
                if (pi.HasValue) windowMinutes = pi.Value;
                else Console.WriteLine($"[twin] Could not parse windowMinutes '{rawVal}' - keeping {_state.WindowMinutes}");
            }

            if (config.Contains("intervalSeconds"))
            {
                rawVal = config["intervalSeconds"];
                var pi = ParseInt(rawVal);
                if (pi.HasValue) intervalSeconds = pi.Value;
                else Console.WriteLine($"[twin] Could not parse intervalSeconds '{rawVal}' - keeping {_state.IntervalSeconds}");
            }

            if (config.Contains("minRequiredOkPercentage"))
            {
                rawVal = config["minRequiredOkPercentage"];
                var pd = ParseDouble(rawVal);
                if (pd.HasValue) minRequiredOkPercentage = pd.Value;
                else Console.WriteLine($"[twin] Could not parse minRequiredOkPercentage '{rawVal}' - keeping {_state.MinRequiredOkPercentage}");
            }

            if (minRequiredOkPercentage > 1.0)
            {
                minRequiredOkPercentage /= 100.0;
            }

            _state.ApplyConfiguration(minTemp, maxTemp, windowMinutes, intervalSeconds, minRequiredOkPercentage);

            if (config is not null)
            {
                Console.WriteLine($"[twin] Applied config: minTemp={_state.MinTempC}, maxTemp={_state.MaxTempC}, windowMinutes={_state.WindowMinutes}, intervalSeconds={_state.IntervalSeconds}, minRequiredOkPercentage={_state.MinRequiredOkPercentage:P0}");
            }
        }
        else
        {
            _state.ApplyConfiguration(minTemp, maxTemp, windowMinutes, intervalSeconds, minRequiredOkPercentage);
        }

        Console.WriteLine($"[twin] DEBUG: _client is {(_client is null ? "NULL" : "NOT NULL")}, about to update reported");
        if (_client is not null)
        {
            try
            {
                var reported = new TwinCollection();
                var repConfig = new TwinCollection
                {
                    ["minTemp"] = _state.MinTempC,
                    ["maxTemp"] = _state.MaxTempC,
                    ["windowMinutes"] = _state.WindowMinutes,
                    ["intervalSeconds"] = _state.IntervalSeconds,
                    ["minRequiredOkPercentage"] = _state.MinRequiredOkPercentage
                };
                reported["config"] = repConfig;
                await _client.UpdateReportedPropertiesAsync(reported);
                Console.WriteLine("[twin] Reported properties updated with applied config and buzzer status.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[twin] Failed to update reported properties: {ex.Message}");
            }
        }
    }
}
