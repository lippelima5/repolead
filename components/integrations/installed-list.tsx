"use client";

import { MoreHorizontal, Radio, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/status-badge";
import { useI18n } from "@/contexts/i18n-context";

export type InstalledIntegrationItem = {
  id: string;
  name: string;
  status: "connected" | "needs_attention" | "disabled";
  last_activity: string | Date;
  events_today: number;
  direction: "source" | "destination";
};

export function InstalledList({
  items,
  emptyTitle,
  emptyDescription,
  onBrowse,
}: {
  items: InstalledIntegrationItem[];
  emptyTitle: string;
  emptyDescription: string;
  onBrowse: () => void;
}) {
  const { t, locale } = useI18n();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border flex items-center justify-center mb-4">
          <Radio className="w-5 h-5 text-muted-foreground" />
        </div>
        <h3 className="text-[14px] font-semibold text-foreground mb-1">{emptyTitle}</h3>
        <p className="text-[13px] text-muted-foreground max-w-sm mb-4">{emptyDescription}</p>
        <Button size="sm" className="h-8 text-[13px]" onClick={onBrowse}>
          {t("common.browse")}
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("common.name")}</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("common.status")}</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                {t("common.events_today")}
              </th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                {t("common.last_activity")}
              </th>
              <th className="w-10 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors duration-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-2 border border-border">
                      {item.direction === "source" ? (
                        <Radio className="w-3.5 h-3.5 text-foreground" />
                      ) : (
                        <Webhook className="w-3.5 h-3.5 text-foreground" />
                      )}
                    </div>
                    <p className="text-[13px] font-medium text-foreground">{item.name}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} label={item.status.replaceAll("_", " ")} />
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-[13px] font-mono text-foreground">{item.events_today.toLocaleString()}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-[12px] text-muted-foreground">
                    {new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en-US", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(item.last_activity))}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="text-[12px]">{t("common.edit")}</DropdownMenuItem>
                      <DropdownMenuItem className="text-[12px]">{t("common.view_logs")}</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-[12px]">{t("common.disable")}</DropdownMenuItem>
                      <DropdownMenuItem className="text-[12px] text-destructive">{t("common.delete")}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
