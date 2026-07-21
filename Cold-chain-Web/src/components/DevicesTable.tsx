import * as React from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BellOffIcon,
  CircleCheckIcon,
  CircleXIcon,
  RotateCwIcon,
  SettingsIcon,
  Volume2Icon,
  XIcon,
  AlertTriangleIcon, // 🔴 NUEVO ICONO AÑADIDO
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetDevices } from "@/hooks/useGetDevices";
import { useSilenceBuzzer } from "@/hooks/useSetSilenceBuzzer";
import type { Device } from "@/types/responses/get-list-devices.response";
import { DeviceConfigurationUI } from "./DeviceConfigurationUI";
import { DeviceAlertsUI } from "./DeviceAlerts";
import { SpinnerLoading } from "./shared/Spinner";
import { socket } from "@/services/socket";
import { toast } from "sonner";

function StatusBadge({ status }: { status: string }) {
  const isEnabled = status?.toLowerCase() === "enabled";
  return (
    <Badge
      variant={isEnabled ? "secondary" : "outline"}
      className={isEnabled ? "text-primary" : ""}
    >
      {isEnabled ? (
        <CircleCheckIcon className="mr-1 size-3" />
      ) : (
        <CircleXIcon className="mr-1 size-3" />
      )}
      {isEnabled ? "Enabled" : "Disabled"}
    </Badge>
  );
}

function ConnectionBadge({ connectionState }: { connectionState: string }) {
  const isConnected = connectionState === "Connected";
  return (
    <Badge variant={isConnected ? "secondary" : "destructive"}>
      <span className="mr-1.5 h-2 w-2 rounded-full bg-current" />
      {isConnected ? "Connected" : "Disconnected"}
    </Badge>
  );
}

enum DeviceConnectionState {
  all = "all",
  connected = "Connected",
  disconnected = "Disconnected",
}

export function DevicesTable() {
  const {
    data: devices,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetDevices();
  const { mutate: silenceBuzzer } = useSilenceBuzzer();

  const [searchId, setSearchId] = React.useState("");
  const [connectionFilter, setConnectionFilter] =
    React.useState<DeviceConnectionState>(DeviceConnectionState.all);
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string | null>(
    null,
  );

  const [selectedAlertsDeviceId, setSelectedAlertsDeviceId] = React.useState<
    string | null
  >(null);

  const [activeBuzzers, setActiveBuzzers] = React.useState<Set<string>>(
    new Set(),
  );
  const [silencingDeviceIds, setSilencingDeviceIds] = React.useState<
    Set<string>
  >(new Set());

  React.useEffect(() => {
    const handleInitialBuzzers = (deviceIds: string[]) =>
      setActiveBuzzers(new Set(deviceIds));
    const handleBuzzerAlert = (data: {
      deviceId: string;
      buzzerActive: boolean;
    }) => {
      setActiveBuzzers((prev) => {
        const next = new Set(prev);
        if (data.buzzerActive) next.add(data.deviceId);
        else next.delete(data.deviceId);
        return next;
      });
    };

    socket.on("device:initial_active_buzzers", handleInitialBuzzers);
    socket.on("device:buzzer_alert", handleBuzzerAlert);
    return () => {
      socket.off("device:initial_active_buzzers", handleInitialBuzzers);
      socket.off("device:buzzer_alert", handleBuzzerAlert);
    };
  }, []);

  const handleSilenceBuzzer = (deviceId: string) => {
    setSilencingDeviceIds((prev) => new Set(prev).add(deviceId));
    silenceBuzzer(deviceId, {
      onSuccess: () => {
        setActiveBuzzers((prev) => {
          const next = new Set(prev);
          next.delete(deviceId);
          return next;
        });
      },
      onError: (error) => {
        toast.error(`The buzzer could not be turned off`);
        console.error("Error:", error);
      },
      onSettled: () => {
        setSilencingDeviceIds((prev) => {
          const next = new Set(prev);
          next.delete(deviceId);
          return next;
        });
      },
    });
  };

  const processedDevices = React.useMemo(() => {
    if (!devices) return [];
    const filtered = devices.filter((device) => {
      const matchesId = device.deviceId
        .toLowerCase()
        .includes(searchId.toLowerCase().trim());
      const matchesConnection =
        connectionFilter === DeviceConnectionState.all ||
        device.connectionState?.toLowerCase() ===
          connectionFilter.toLowerCase();
      return matchesId && matchesConnection;
    });

    return filtered.sort((a, b) => {
      const timeA = a.lastActivityTime
        ? new Date(a.lastActivityTime).getTime()
        : 0;
      const timeB = b.lastActivityTime
        ? new Date(b.lastActivityTime).getTime()
        : 0;
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });
  }, [devices, searchId, connectionFilter, sortOrder]);

  const hasActiveFilters =
    searchId !== "" || connectionFilter !== DeviceConnectionState.all;

  const handleClearFilters = () => {
    setSearchId("");
    setConnectionFilter(DeviceConnectionState.all);
    setSortOrder("desc");
  };

  const toggleSortOrder = () =>
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>IoT Devices</CardTitle>
          <CardDescription>
            Lista de dispositivos activos registrados en Azure IoT Hub.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                placeholder="Search by Device..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full sm:max-w-xs"
              />
              <Select
                value={connectionFilter}
                onValueChange={(value) =>
                  setConnectionFilter(value as DeviceConnectionState)
                }
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Estado de conexión" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DeviceConnectionState.all}>All</SelectItem>
                  <SelectItem value={DeviceConnectionState.connected}>
                    Connected
                  </SelectItem>
                  <SelectItem value={DeviceConnectionState.disconnected}>
                    Disconnected
                  </SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={handleClearFilters}
                  className="self-start text-muted-foreground hover:text-foreground sm:self-auto"
                >
                  <XIcon className="mr-1.5 size-4" /> Clear filters
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              className="self-end sm:self-auto"
            >
              <RotateCwIcon
                className={`size-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          {isLoading && <SpinnerLoading>Loading devices</SpinnerLoading>}
          {isError && (
            <div className="py-8 text-center text-sm text-destructive">
              Error fetching devices
            </div>
          )}

          {!isLoading && !isError && (
            <div className="relative max-h-[500px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
                  <TableRow className="bg-card hover:bg-card">
                    <TableHead className="bg-card">ID Device</TableHead>
                    <TableHead className="bg-card">Status</TableHead>
                    <TableHead className="bg-card">Connection State</TableHead>
                    <TableHead className="bg-card text-center">
                      Buzzer Alert
                    </TableHead>
                    <TableHead className="bg-card text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleSortOrder}
                        className="-mr-3 font-semibold hover:bg-transparent"
                      >
                        Last connection
                        {sortOrder === "desc" ? (
                          <ArrowDownIcon className="ml-1.5 size-4" />
                        ) : (
                          <ArrowUpIcon className="ml-1.5 size-4" />
                        )}
                      </Button>
                    </TableHead>

                    {/* 🔴 NUEVA COLUMNA EN EL HEADER */}
                    <TableHead className="bg-card text-center">
                      Alerts
                    </TableHead>

                    <TableHead className="bg-card text-center">
                      Configuration
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedDevices.length > 0 ? (
                    processedDevices.map((device: Device) => {
                      const isBuzzerActive = activeBuzzers.has(device.deviceId);
                      const isSilencing = silencingDeviceIds.has(
                        device.deviceId,
                      );

                      return (
                        <TableRow
                          key={device.deviceId}
                          className={
                            isBuzzerActive
                              ? "bg-destructive/10 hover:bg-destructive/15"
                              : ""
                          }
                        >
                          <TableCell className="font-mono font-medium">
                            {device.deviceId}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={device.status} />
                          </TableCell>
                          <TableCell>
                            <ConnectionBadge
                              connectionState={device.connectionState}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {isBuzzerActive ? (
                              <div className="flex items-center justify-center gap-2">
                                <Badge
                                  variant="destructive"
                                  className="animate-pulse"
                                >
                                  <Volume2Icon className="mr-1 size-3" /> Active
                                </Badge>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    handleSilenceBuzzer(device.deviceId)
                                  }
                                  disabled={isSilencing}
                                  className="h-7 px-2.5 text-xs"
                                >
                                  <BellOffIcon className="mr-1 size-3" />{" "}
                                  {isSilencing ? "Silencing..." : "Silence"}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Off
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {device.lastActivityTime
                              ? new Date(
                                  device.lastActivityTime,
                                ).toLocaleString()
                              : "Sin registros"}
                          </TableCell>

                          {/* 🔴 NUEVA CELDA CON EL BOTÓN PARA ABRIR LAS ALERTAS */}
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setSelectedAlertsDeviceId(device.deviceId)
                              }
                              title="Ver historial de alertas"
                            >
                              <AlertTriangleIcon className="size-4 text-amber-500" />
                            </Button>
                          </TableCell>

                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setSelectedDeviceId(device.deviceId)
                              }
                              title="Configurar dispositivo"
                            >
                              <SettingsIcon className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-24 text-center text-muted-foreground"
                      >
                        {hasActiveFilters
                          ? "No se encontraron dispositivos que coincidan con la búsqueda."
                          : "No se encontraron dispositivos en IoT Hub."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DeviceConfigurationUI
        selectedDeviceId={selectedDeviceId}
        onClose={() => setSelectedDeviceId(null)}
      />

      <DeviceAlertsUI
        selectedDeviceId={selectedAlertsDeviceId}
        onClose={() => setSelectedAlertsDeviceId(null)}
      />
    </>
  );
}
