import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertItem } from "./AlertItem";
import { SpinnerLoading } from "./shared/Spinner";
import { useGetDeviceAlerts } from "@/hooks/useGetDeviceAlerts";

interface DeviceAlertsUIProps {
  selectedDeviceId: string | null;
  onClose: () => void;
}

export function DeviceAlertsUI({
  selectedDeviceId,
  onClose,
}: DeviceAlertsUIProps) {
  const isOpen = selectedDeviceId !== null;

  const {
    data: alerts,
    isLoading,
    isError,
  } = useGetDeviceAlerts(selectedDeviceId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alert history</DialogTitle>
          <DialogDescription>
            <span className="font-mono font-bold text-foreground">
              {selectedDeviceId}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <SpinnerLoading>Loading alerts...</SpinnerLoading>
            </div>
          ) : isError ? (
            <div className="text-center text-sm text-destructive py-6">
              Error fetching alerts
            </div>
          ) : alerts && alerts.deviceAlerts.length > 0 ? (
            alerts.deviceAlerts.map((alert) => (
              <AlertItem key={alert.alertId} alert={alert} />
            ))
          ) : (
            <div className="text-center text-sm text-muted-foreground py-6">
              There are no alerts recorded for this device
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
