# ARCHITECTURE DIAGRAM

# ASSUMPTIONS

# COMPONENT CHOICES

> ## DEVICE (AGENT)

> ## AZURE IoT HUB

> ## Server (Back-end)

> ## Client (Front-end)

> ## Database design

# SECURITY CONSIDERATIONS

- **Zero Hardcoded Secrets:** No connection strings, master keys, or access tokens are stored in the source code repository.

- **Environment Configuration:** All sensitive infrastructure credentials are loaded at runtime through environmental variables using a secure `.env` file, which is strictly blacklisted in `.gitignore`. A `.env.example` template is provided for deployment reproducibility without exposing secrets and keys.

- **Only authenticated and authorized users** should be allowed to interact with devices or access their telemetry. Implementing proper authentication and role-based authorization helps protect sensitive data, prevents unauthorized device manipulation, and ensures secure system operation.

# SUGGESTIONS AND FUTURE WORK

> - Consider **assigning a default configuration to newly created devices**. This helps prevent null or inconsistent configurations, reducing the risk of bugs and ensuring predictable device behavior from the initial setup.

> - Allow users to create device groups to **apply configuration changes to multiple devices simultaneously**, eliminating the need to configure each device individually

> - Implement **localization** in the frontend to support multiple languages, time zones, and regional settings
> - Allow users to **switch between Celsius and Fahrenheit** for temperature display and configuration

# DICTIONARY

- reaction time:
- density percentage:
