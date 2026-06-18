import { Loader2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Spinner({ size = "md", className, label }: SpinnerProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-brand-400", sizeClasses[size])} />
      {label && <span className="text-sm text-secondary">{label}</span>}
    </div>
  );
}

export function FullPageSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  );
}
