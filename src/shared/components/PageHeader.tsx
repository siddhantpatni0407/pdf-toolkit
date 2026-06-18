import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ icon: Icon, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-6", className)}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/20 border border-brand-600/30 flex-shrink-0">
          <Icon className="h-5 w-5 text-brand-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-primary">{title}</h1>
          {description && <p className="text-sm text-secondary">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
