# ARCHITECTURE DIAGRAM

# ASSUMPTIONS

- **Device names are unique** by default and should not be modified. This ensures consistency across the database that store telemetry data, alert reports and device configuration alerts.

- **Device (agent) has pre-configured alerts by default**, if there are no configurations alerts, it will only capture the telemetry.

- The web application is intended exclusively for **authenticated and authorized** users, such as operators and administrators, who are responsible for monitoring and managing IoT devices.

- All timestamp records within the system are handled using UTC time ensuring consistency across devices, servers, and different geographic locations, avoiding issues caused by different local time zones or daylight saving changes.

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
  - **LOW** (65%)
  - **MEDIUM** (75%)
  - **HIGH** (85%)

This logic is executed locally by the agent, operating autonomously and **activate the buzzer even when the device is offline or temporarily disconnected** from the network or server is down.

> When the device starts operating, it retrieves the available configuration from the Device Twin and applies it to its internal logic. This allows the device to dynamically adapt its behavior based on the configuration defined remotely without requiring manual changes or firmware updates.

### UTC Timestamp Standardization

The device was configured to provide timestamps in **UTC format** instead of local time. Previously, the device generated telemetry timestamps using local time, which could introduce inconsistencies when processing data across different services, time zones, or when correlating events from multiple sources.

Using UTC as the standard ensures that telemetry data, alerts, logs, and other system events use a consistent time reference across the entire platform.

> ## Server (Back-end)

The backend acts as the central integration layer between Azure IoT Hub, the database, and the web application, providing data processing, business logic, and secure access to device information and telemetry.

The server is responsible for generating and recording operational alerts. Although the device operates autonomously and is capable of activating the buzzer when an abnormal condition is detected, it is still necessary to maintain a centralized record of all generated alerts. This is important because a scenario could occur where the temperature remains out of the allowed range for an extended period of time, but no operator notices the event. Later, the temperature may return to normal, causing the buzzer to turn off automatically, leaving no visible indication that an incident occurred.

To address this situation, the server implements an evaluation process using the same algorithm as the device. However, its purpose is not to control the buzzer but rather to continuously analyze incoming telemetry and register detected events in the database. This provides historical traceability of incidents and ensures that important operational events are not lost, even if the physical device has already recovered.

Additionally, the system stores all received telemetry data to support future reporting capabilities and allow users to analyze device behavior, sensor trends, and temperature patterns over time. This historical data is essential for identifying anomalies, evaluating device performance, and supporting maintenance decisions. Considering the nature of IoT environments, where messages can occasionally arrive duplicated, delayed, or out of order, a database validation rule was implemented to prevent duplicate telemetry records from being stored. This ensures that each measurement is registered only once, maintaining data integrity and preventing inaccurate reports, duplicated alerts, or unexpected behavior during data analysis. This approach improves the reliability of the monitoring platform and ensures that operational decisions are based on accurate information.

The server includes a web API developed to expose the system's use cases through well-defined endpoints, allowing external services and applications to integrate with the platform. This API acts as an interface between the backend logic and other consumers, providing controlled access to functionalities such as device management, telemetry retrieval, alert information, and configuration operations, this approach maintains a clear separation between the internal business logic and external consumers, improving maintainability, scalability, and security by controlling how data and operations are accessed

- The server follows the principles of *Clean Architecture* to ensure a clear separation of concerns between layers. By decoupling the components, new features and changes can be introduced with minimal impact on the rest of the system, making the codebase easier to evolve and maintain.

- Additionally, the Repository Pattern was implemented to abstract data access from the business logic. This allows the underlying persistence mechanism to be replaced or modified (for example, migrating from SQLite to PostgreSQL or another database or even using an ORM) without affecting the application's use cases. As a result, database-related changes remain isolated within the repository layer, preserving the integrity of the domain and application logic while simplifying future maintenance and scalability.

> ## Client (Front-end)

A web application was developed to simplify operator interactions with the system's use cases. Additionally, because the application is accessible from multiple devices through a web browser, it offers significant advantages in terms of deployment, accessibility, and maintenance. 

React was chosen as the frontend framework because of its component-based architecture, which encourages the creation of reusable, modular, and maintainable UI components. Its large ecosystem of libraries, including mature UI component frameworks, significantly accelerates development while ensuring a consistent and modern user experience. This approach also makes it easier to extend the application with new features without requiring major changes to the existing codebase.

Additionally, custom React hooks were implemented to encapsulate reusable business logic and separate it from presentation components. This allows UI components to focus on rendering and managing their own local state, while shared behaviors such as data fetching, form handling, and business rules remain centralized and reusable. As a result, the codebase becomes easier to understand, test, and maintain.

The application also follows a clear separation of responsibilities by abstracting API communication into reusable Axios HTTP clients, avoiding duplicated networking logic and providing a single place to configure aspects such as base URLs. TanStack Query was adopted to handle data fetching, caching, synchronization, and HTTP mutations, reducing the amount of manual state management required, improves application performance by minimizing unnecessary network requests and also we can use cache for some, and ensures that the UI remains synchronized with the backend while providing built-in support for loading, error, and retry states. Overall, these architectural decisions result in a scalable, maintainable, and high-performance frontend application.

- WebSockets were implemented to provide real-time communication between the backend and the web application. This was a critical architectural decision because one of the primary use cases is the ability to remotely silence a device's buzzer. To support this functionality, the application must continuously monitor the current state of each device and immediately notify operators whenever the buzzer is activated in the web app. This approach reduces unnecessary network traffic compared to periodic polling and provides a more efficient and scalable solution for real-time monitoring allowing operators to immediately identify which device requires attention.

- Configuration device form with predefined options was implemented to prevent users from creating invalid or impractical device configurations that could lead to unexpected system behavior. Instead of allowing unrestricted input, users select from carefully designed configuration values that align with the operational requirements. The *Evaluation Time* is limited to appropriate values to ensure that temperature measurements are evaluated frequently enough to detect abnormal conditions in a timely manner. Allowing excessively long evaluation windows could delay alert generation and reduce the effectiveness of the monitoring process.
- The web application provides three predefined sensitivity levels—High, Medium, and Low, estricting configuration to validated options, the system becomes more reliable, easier to operate, and less prone to misconfiguration

> ## Database design

SQLite was chosen for this coding exercise due to its lightweight nature, simplicity, and ease of setup. It provides a straightforward solution that minimizes infrastructure requirements while remaining sufficient for the expected workload.

As the volume of telemetry and application data grows, it is recommended to migrate to a more scalable database (maybe a cloud database) solution capable of handling higher write throughput, larger datasets, and increased concurrency. This would improve overall performance, reduce resource consumption on the application server, and better support future scalability requirements

The database diagram:

Database to save alerts, telemetry and devices configurations


# SECURITY CONSIDERATIONS

- **Only authenticated and authorized users** should be allowed to interact with devices or access their telemetrya and turn off the buzzer. Implementing proper authentication and role-based authorization helps protect sensitive data, prevents unauthorized device manipulation, and ensures secure system operation.
  
- **Zero Hardcoded Secrets:** No connection strings, master keys, or access tokens are stored in the source code repository.

- **Environment Configuration:** All sensitive infrastructure credentials are loaded at runtime through environmental variables using a secure `.env` file, which is strictly blacklisted in `.gitignore`. A `.env.example` template is provided for deployment reproducibility without exposing secrets and keys.

- **Only devices authorized and registered in the IoT Hub are allowed**. This helps prevent unauthorized devices from accessing, stealing, or tampering with the data that is stored and managed by the system.

- **Generate unique device identifiers to improve security**. To reduce the risk of exposing sensitive information, each device should be assigned a unique name combined with a short random hash. This makes it more **difficult to identify or enumerate devices registered** in IoT Hub. For example, avoid predictable names such as "Device 1", "Device 2", or "Device 3". Instead, use identifiers like "temp-sensor-a7f3", "tracker-x92b", or similar randomized naming conventions.

- Implement **role-based permissions for managing devices**, whether for individual devices or device groups. This ensures that users can only view and modify the devices or groups that fall under their assigned permissions and responsibilities.
  

# TRADE OFFS

## Direct methods
- The solution uses **Azure IoT Hub Direct Methods** to execute immediate commands on connected devices, such as silencing the buzzer. Direct Methods were chosen because they provide a request-response communication model, allowing the server to know whether the device successfully executed the command.
  - **Advantages:** Immediate execution, synchronous response, and confirmation of command success or failure.
  - **Disadvantages:** The device must be online and connected to Azure IoT Hub when the method is invoked. If the device is offline, the command cannot be executed, unlike queued cloud-to-device messages that can be delivered later.

## Sqlite
- **sqlite** was selected because the project is intended as a lightweight demo and can be run without installing a database server.
  - Limited concurrent writes.
  - Not suitable for high-volume production telemetry.
  - Would likely be replaced with PostgreSQL or Azure SQL in production.

## Configuration persistence and device twins
- Device configurations are persisted in the application's database and synchronized to Azure IoT Hub using **Device Twin desired properties**. The database serves as the system of record for the web application, while Device Twins ensure that devices receive the latest configuration whenever they are connected.
  - **Advantages:** Centralized configuration management, persistent history, and automatic synchronization through Device Twins without requiring the device to be continuously online. Devices can retrieve pending configuration updates after reconnecting.
  - **Disadvantages:** Configuration changes are not applied instantly, as synchronization depends on Azure IoT Hub and the device reporting its updated twin. This also introduces the need to keep the database and Device Twin synchronized to avoid temporary inconsistencies.

## Clean architecture
- The backend follows **Clean Architecture** to separate business logic from infrastructure concerns such as Azure IoT Hub, the database, and the HTTP API. This separation keeps the core application independent of external technologies, making the codebase easier to maintain, test, and extend.
  - **Advantages:** Clear separation of responsibilities, improved testability, easier maintenance, and the flexibility to replace infrastructure components (e.g., the database or messaging service) with minimal impact on the business logic.
  - **Disadvantages:** Introduces additional layers, interfaces, and boilerplate code, increasing the initial complexity and development effort compared to a simpler architecture.


# SUGGESTIONS AND FUTURE WORK

 - Consider **assigning a default configuration to newly created devices**. This helps prevent null or inconsistent configurations, reducing the risk of bugs and ensuring predictable device behavior from the initial setup.

    -  NOTE: For this coding exercise, I provided default configurations for the device agent.

 - Allow users to create device groups to **apply configuration changes to multiple devices simultaneously**, eliminating the need to configure each device individually

 - Implement **localization** in the frontend to support multiple languages, time zones, and regional settings

 - Allow users to **switch between Celsius and Fahrenheit** for temperature display and configuration

 - Implement **predefined critical temperature alerts** that can override the standard evaluation process when an abnormal temperature increase/decrease is detected, should be **triggered immediately when the measured temperature rises rapidly or exceeds a critical threshold**, without waiting for the configured evaluation time to complete

 - Create a reporting section where users can view metrics through interactive charts to better **understand the behavior of the device and its sensors**.

 - Create technical reports that detect continuous fluctuations in a device. These reports can help **identify whether a sensor is malfunctioning, requires maintenance, or is being affected by external factors**.
