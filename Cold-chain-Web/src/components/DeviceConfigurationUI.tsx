import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  COMPLIANCE_OPTIONS,
  INTERVAL_SECONDS_OPTIONS,
  TEMP_OPTIONS,
  WINDOW_MINUTES_OPTIONS,
  useDeviceConfigurationForm,
} from "./useDeviceConfigurationForm";

interface Props {
  selectedDeviceId: string | null;
  onClose: () => void;
}

export const DeviceConfigurationUI = ({ selectedDeviceId, onClose }: Props) => {
  const {
    form,
    onSubmit,
    isSubmitting,
    isLoadingConfig,
    handleMinTempChange,
    handleMaxTempChange,
  } = useDeviceConfigurationForm({
    selectedDeviceId,
    onClose,
  });

  return (
    <Sheet
      open={!!selectedDeviceId}
      onOpenChange={(open) => !open && onClose()}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto p-6 sm:p-8 flex flex-col gap-6"
      >
        {selectedDeviceId && (
          <>
            <SheetHeader className="p-0">
              <SheetTitle className="font-mono text-lg">
                {selectedDeviceId}
              </SheetTitle>
              <SheetDescription>
                Device threshold and telemetry frequency settings.
              </SheetDescription>
            </SheetHeader>

            {isLoadingConfig ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Loading current configuration...</p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={onSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minTempC"
                      render={({ field }) => {
                        const selectedMinOption = TEMP_OPTIONS.find(
                          (opt) => opt.value === field.value?.toString(),
                        );

                        return (
                          <FormItem>
                            <FormLabel>Min Temp (°C)</FormLabel>
                            <Select
                              onValueChange={(val) =>
                                handleMinTempChange(Number(val))
                              }
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full h-10">
                                  <SelectValue placeholder="Select min">
                                    {selectedMinOption?.label}
                                  </SelectValue>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {TEMP_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="maxTempC"
                      render={({ field }) => {
                        const selectedMaxOption = TEMP_OPTIONS.find(
                          (opt) => opt.value === field.value?.toString(),
                        );

                        return (
                          <FormItem>
                            <FormLabel>Max Temp (°C)</FormLabel>
                            <Select
                              onValueChange={(val) =>
                                handleMaxTempChange(Number(val))
                              }
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full h-10">
                                  <SelectValue placeholder="Select max">
                                    {selectedMaxOption?.label}
                                  </SelectValue>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {TEMP_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="windowMinutes"
                    render={({ field }) => {
                      const selectedWindowOption = WINDOW_MINUTES_OPTIONS.find(
                        (opt) => opt.value === field.value?.toString(),
                      );

                      return (
                        <FormItem>
                          <FormLabel>Tolerance Window</FormLabel>
                          <Select
                            onValueChange={(val) => field.onChange(Number(val))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Select tolerance window">
                                  {selectedWindowOption?.label}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {WINDOW_MINUTES_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose the period over which sensor measurements are
                            evaluated
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="intervalSeconds"
                    render={({ field }) => {
                      const selectedIntervalOption =
                        INTERVAL_SECONDS_OPTIONS.find(
                          (opt) => opt.value === field.value?.toString(),
                        );

                      return (
                        <FormItem>
                          <FormLabel>Telemetry Interval</FormLabel>
                          <Select
                            onValueChange={(val) => field.onChange(Number(val))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Select interval">
                                  {selectedIntervalOption?.label}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {INTERVAL_SECONDS_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Telemetry Frequency</FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="minRequiredOkPercentage"
                    render={({ field }) => {
                      const selectedCompliance = COMPLIANCE_OPTIONS.find(
                        (opt) => opt.value === field.value,
                      );

                      return (
                        <FormItem>
                          <FormLabel>Sensibility level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Select compliance level">
                                  {selectedCompliance && (
                                    <span
                                      className={cn(
                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
                                        selectedCompliance.badgeClass,
                                      )}
                                    >
                                      {selectedCompliance.label}
                                    </span>
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COMPLIANCE_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  <span
                                    className={cn(
                                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
                                      option.badgeClass,
                                    )}
                                  >
                                    {option.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Percentage of measurements that must be within the
                            acceptable
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default DeviceConfigurationUI;
