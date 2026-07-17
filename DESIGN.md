# ARCHITECTURE DIAGRAM

# ASSUMPTIONS

- **Device names are unique** by default and should not be modified. This ensures consistency across the databases that store telemetry data and alert reports.

- **Device (agent) has pre-configured alerts by default**.

- The web application is intended exclusively for authenticated and authorized users, such as operators and administrators, who are responsible for monitoring and managing IoT devices

-

# COMPONENT CHOICES

> ## DEVICE (AGENT)

The device is responsible for continuously monitoring the measured temperature and evaluating it against a predefined configuration provided by the final user (operator or client or administrator)

To operate correctly, each device should be provisioned with an initial configuration that includes:

- **Interval seconds**: The number of seconds between each sensor reading.
- **Minimum Temperature**: The lowest acceptable temperature threshold.
- **Maximum Temperature**: The highest acceptable temperature threshold.
- **Evaluation Time**: The Evaluation Time defines the time window over which sensor measurements are analyzed before determining whether an alert should be triggered.
  > - Instead of evaluating individual sensor readings, the agent continuously collects measurements throughout the configured evaluation period time. This approach reduces the likelihood of false alarm caused by temporary spikes, sensor manipulation, electrical noise, or other unexpected events that may affect isolated readings.
  > - At the end of the evaluation window, the agent analyzes all collected measurements and determines whether the configured sensitivity threshold has been exceeded. If the required percentage of measurements falls outside the configured operating range, the device activates the buzzer
  > - The duration of the evaluation window is configurable by the user, allowing the monitoring behavior to be adapted to different operating environments and sensor characteristics.
- **Sensibility Level**: Provides three predefined sensitivity levels. Each level represents the minimum percentage of out-of-range measurements required within the evaluation window before an alert is generated.
  - **LOW** (60%)
  - **MEDIUM** (75%)
  - **HIGH** (85%)

This logic is executed locally by the agent, operating autonomously and activate the buzzer even when the device is offline or temporarily disconnected from the network or server is down.

> ## Server (Back-end)

Worker server to subscribe to IoThub

> ## Client (Front-end)

Web app

> ## Database design

Database to save alerts, telemetry and devices configurations

# SECURITY CONSIDERATIONS

- **Zero Hardcoded Secrets:** No connection strings, master keys, or access tokens are stored in the source code repository.

- **Environment Configuration:** All sensitive infrastructure credentials are loaded at runtime through environmental variables using a secure `.env` file, which is strictly blacklisted in `.gitignore`. A `.env.example` template is provided for deployment reproducibility without exposing secrets and keys.

- **Only authenticated and authorized users** should be allowed to interact with devices or access their telemetrya and turn off the buzzer. Implementing proper authentication and role-based authorization helps protect sensitive data, prevents unauthorized device manipulation, and ensures secure system operation.

# SUGGESTIONS AND FUTURE WORK

> - Consider **assigning a default configuration to newly created devices**. This helps prevent null or inconsistent configurations, reducing the risk of bugs and ensuring predictable device behavior from the initial setup.

    - NOTE: For this challenge, I provided default configurations for the agent.

> - Allow users to create device groups to **apply configuration changes to multiple devices simultaneously**, eliminating the need to configure each device individually

> - Implement **localization** in the frontend to support multiple languages, time zones, and regional settings
> - Allow users to **switch between Celsius and Fahrenheit** for temperature display and configuration

> - Implement **predefined critical temperature alerts** that can override the standard evaluation process when an abnormal temperature increase/decrease is detected, should be **triggered immediately when the measured temperature rises rapidly or exceeds a critical threshold**, without waiting for the configured evaluation time to complete
