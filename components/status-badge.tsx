import { cn } from "@/lib/utils";

const statusClassMap: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  contacted: "bg-warning/10 text-warning",
  qualified: "bg-chart-4/10 text-[hsl(262_83%_58%)]",
  won: "bg-success/10 text-success",
  lost: "bg-destructive/10 text-destructive",
  success: "bg-success/10 text-success",
  failed: "bg-destructive/10 text-destructive",
  dead_letter: "bg-warning/10 text-warning",
  pending: "bg-muted text-muted-foreground",
  active: "bg-success/10 text-success",
  inactive: "bg-muted text-muted-foreground",
  degraded: "bg-warning/10 text-warning",
  ingested: "bg-primary/10 text-primary",
  normalized: "bg-chart-4/10 text-[hsl(262_83%_58%)]",
  merged: "bg-warning/10 text-warning",
  delivered: "bg-success/10 text-success",
  delivery_failed: "bg-destructive/10 text-destructive",
  replayed: "bg-primary/10 text-primary",
  connected: "bg-success/10 text-success",
  needs_attention: "bg-warning/10 text-warning",
  disabled: "bg-muted text-muted-foreground",
};

type StatusBadgeProps = {
  status: string;
  label?: string;
  className?: string;
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium leading-none",
        statusClassMap[status] || "bg-muted text-muted-foreground",
        className,
      )}
    >
      {label || status.replaceAll("_", " ")}
    </span>
  );
}
