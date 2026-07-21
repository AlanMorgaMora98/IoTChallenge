import * as React from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useUpdateDeviceConfiguration } from "@/hooks/useUpdateDeviceConfig";
import { useGetDeviceConfiguration } from "@/hooks/useGetDeviceConfig";

export const MIN_TEMP_BOUND = -10;
export const MAX_TEMP_BOUND = 30;

export const COMPLIANCE_OPTIONS = [
  {
    label: "High (85%)",
    value: "85",
    badgeClass:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  {
    label: "Medium (75%)",
    value: "75",
    badgeClass:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  {
    label: "Low (65%)",
    value: "65",
    badgeClass:
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
  },
] as const;

export const WINDOW_MINUTES_OPTIONS = [
  { label: "3 minutes", value: "3" },
  { label: "5 minutes", value: "5" },
  { label: "10 minutes", value: "10" },
  { label: "15 minutes", value: "15" },
] as const;

export const INTERVAL_SECONDS_OPTIONS = [
  { label: "5 seconds", value: "5" },
  { label: "10 seconds", value: "10" },
  { label: "15 seconds", value: "15" },
  { label: "30 seconds", value: "30" },
  { label: "60 seconds", value: "60" },
] as const;

export const TEMP_OPTIONS = Array.from(
  { length: MAX_TEMP_BOUND - MIN_TEMP_BOUND + 1 },
  (_, i) => {
    const temp = i + MIN_TEMP_BOUND;
    return {
      label: `${temp}°C`,
      value: temp.toString(),
    };
  },
);

export const deviceConfigSchema = z.object({
  minTempC: z.number({ message: "Select min temp" }),
  maxTempC: z.number({ message: "Select max temp" }),
  windowMinutes: z.number({ message: "Select tolerance window" }),
  intervalSeconds: z.number({ message: "Select telemetry interval" }),
  minRequiredOkPercentage: z.string({ message: "Select compliance level" }),
});

export type DeviceConfigFormValues = z.infer<typeof deviceConfigSchema>;

interface UseDeviceConfigurationProps {
  selectedDeviceId: string | null;
  onClose: () => void;
}

interface UseDeviceConfigurationReturn {
  form: UseFormReturn<DeviceConfigFormValues>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
  isLoadingConfig: boolean;
  handleMinTempChange: (newMin: number) => void;
  handleMaxTempChange: (newMax: number) => void;
}

export const useDeviceConfigurationForm = ({
  selectedDeviceId,
  onClose,
}: UseDeviceConfigurationProps): UseDeviceConfigurationReturn => {
  const { data: configResponse, isLoading: isLoadingConfig } =
    useGetDeviceConfiguration(selectedDeviceId);

  const { mutateAsync: updateConfig, isPending: isUpdating } =
    useUpdateDeviceConfiguration();

  const form = useForm({
    resolver: zodResolver(deviceConfigSchema),
    defaultValues: {
      minTempC: 2,
      maxTempC: 8,
      windowMinutes: 3,
      intervalSeconds: 10,
      minRequiredOkPercentage: "75",
    },
  });

  React.useEffect(() => {
    if (configResponse?.deviceConfiguration) {
      const config = configResponse.deviceConfiguration;

      form.reset({
        minTempC: config.minTemp,
        maxTempC: config.maxTemp,
        windowMinutes: config.windowMinutes,
        intervalSeconds: config.intervalSeconds,
        minRequiredOkPercentage: config.minRequiredOkPercentage.toString(),
      });
    }
  }, [configResponse, form]);

  const handleMinTempChange = (newMin: number) => {
    form.setValue("minTempC", newMin);
    const currentMax = form.getValues("maxTempC");

    if (newMin >= currentMax) {
      const nextMax = Math.min(newMin + 1, MAX_TEMP_BOUND);
      form.setValue("maxTempC", nextMax);
      toast.info(`Max temperature automatically adjusted to ${nextMax}°C`);
    }
  };

  const handleMaxTempChange = (newMax: number) => {
    form.setValue("maxTempC", newMax);
    const currentMin = form.getValues("minTempC");

    if (newMax <= currentMin) {
      const nextMin = Math.max(newMax - 1, MIN_TEMP_BOUND);
      form.setValue("minTempC", nextMin);
      toast.info(`Min temperature automatically adjusted to ${nextMin}°C`);
    }
  };

  const handleSubmit = async (values: DeviceConfigFormValues) => {
    if (!selectedDeviceId) return;

    try {
      await updateConfig({
        deviceId: selectedDeviceId,
        payload: {
          minTemp: values.minTempC,
          maxTemp: values.maxTempC,
          windowMinutes: values.windowMinutes,
          intervalSeconds: values.intervalSeconds,
          minRequiredOkPercentage: Number(values.minRequiredOkPercentage),
        },
      });

      toast.success("Device configuration saved successfully!");
      onClose();
    } catch (error) {
      console.error("Failed to save device configuration:", error);
      toast.error(
        "Failed to save configuration. Please check your connection.",
      );
    }
  };

  return {
    form,
    onSubmit: form.handleSubmit(handleSubmit),
    isSubmitting: isUpdating,
    isLoadingConfig,
    handleMinTempChange,
    handleMaxTempChange,
  };
};
