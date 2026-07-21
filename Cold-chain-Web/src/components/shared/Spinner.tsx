import { cn } from "@/lib/utils";
import { LoaderIcon } from "lucide-react";

interface SpinnerLoadingProps {
  children?: React.ReactNode;
  className?: string;
}

function CustomSpinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export function SpinnerLoading({ children, className }: SpinnerLoadingProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <CustomSpinner className={className} />

      {children && (
        <div className="text-sm text-muted-foreground text-center">
          {children}
        </div>
      )}
    </div>
  );
}
