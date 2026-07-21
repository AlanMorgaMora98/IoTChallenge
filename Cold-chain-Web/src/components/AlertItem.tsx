import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  InfoIcon,
} from "lucide-react";
import type { DeviceAlert } from "@/types/responses/get-device-alerts.response";

export function AlertItem({ alert }: { alert: DeviceAlert }) {
  const state = alert.state?.toLowerCase() || "";

  let icon = <InfoIcon className="size-5 text-blue-500" />;
  let containerClass = "border-blue-500/50 bg-blue-500/10";
  let textClass = "text-blue-700 dark:text-blue-400";
  let stateLabel = "Info";

  if (state === "active") {
    icon = <AlertTriangleIcon className="size-5 text-destructive" />;
    containerClass = "border-destructive/50 bg-destructive/10";
    textClass = "text-destructive font-bold";
    stateLabel = "Active";
  } else if (state === "acknowledged") {
    icon = <ClockIcon className="size-5 text-amber-500" />;
    containerClass = "border-amber-500/50 bg-amber-500/10";
    textClass = "text-amber-700 dark:text-amber-400 font-semibold";
    stateLabel = "Ackowledge";
  } else if (state === "resolved") {
    icon = <CheckCircleIcon className="size-5 text-green-500" />;
    containerClass = "border-green-500/50 bg-green-500/10";
    textClass = "text-green-700 dark:text-green-400";
    stateLabel = "Resolve";
  }

  const formatTime = (dateValue: Date | string | null | undefined) => {
    if (!dateValue) return null;
    return new Date(dateValue).toLocaleString();
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 ${containerClass}`}
    >
      <div className="mt-0.5 shrink-0">{icon}</div>

      <div className="flex flex-col flex-1 gap-1.5">
        <div className="flex justify-between items-start gap-2">
          <p className={`text-sm leading-tight ${textClass}`}>
            Alert: {stateLabel} <br />
            <span className="font-normal text-foreground">
              Trigger Value:{" "}
              <span className="font-mono font-medium">
                {alert.triggerValue}
              </span>
            </span>
          </p>
          <span className="text-xs font-mono bg-background/50 px-1.5 py-0.5 rounded border">
            #{alert.alertId}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-1 text-[11px] text-muted-foreground mt-1">
          <div>
            <span className="font-medium text-foreground/80">Started at:</span>{" "}
            {formatTime(alert.startedAt)}
          </div>
          {alert.acknowledgedAt && (
            <div>
              <span className="font-medium text-foreground/80">
                Acknowledge at:
              </span>{" "}
              {formatTime(alert.acknowledgedAt)}
            </div>
          )}
          {alert.resolvedAt && (
            <div>
              <span className="font-medium text-foreground/80">
                Resolved at:
              </span>{" "}
              {formatTime(alert.resolvedAt)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
