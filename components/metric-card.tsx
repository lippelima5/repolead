import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  iconClassName?: string;
};

export function MetricCard({ title, value, change, icon: Icon, iconClassName }: MetricCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] text-muted-foreground font-medium">{title}</p>
        <div className={cn("p-1.5 rounded-lg bg-primary/10", iconClassName)}>
          <Icon className={cn("w-4 h-4 text-primary", iconClassName ? "" : "text-primary")} />
        </div>
      </div>
      <p className="text-2xl font-semibold text-foreground tracking-tight">{value}</p>
      {change !== undefined ? (
        <p className={cn("text-xs font-medium mt-1", change >= 0 ? "text-success" : "text-destructive")}>
          {change >= 0 ? "+" : ""}
          {change}%
        </p>
      ) : null}
    </div>
  );
}
