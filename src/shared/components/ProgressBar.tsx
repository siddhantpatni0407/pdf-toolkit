import { cn } from "@/shared/utils/cn";

interface ProgressBarProps {
  value: number; // 0-100
  variant?: "default" | "success" | "error";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  variant = "default",
  size = "md",
  showLabel = false,
  animated = false,
  className,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const trackClasses = {
    sm: "h-1",
    md: "h-1.5",
    lg: "h-2.5",
  };

  const barClasses = {
    default: "bg-brand-500",
    success: "bg-emerald-500",
    error: "bg-red-500",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-secondary">{clampedValue.toFixed(0)}%</span>
        </div>
      )}
      <div className={cn("w-full bg-slate-700/50 rounded-full overflow-hidden", trackClasses[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            barClasses[variant],
            animated && "animate-pulse-slow"
          )}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
