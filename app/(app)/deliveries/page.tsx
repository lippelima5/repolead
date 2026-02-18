"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/app-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/i18n-context";

type DeliveryRow = {
  id: string;
  event_type: string;
  status: "pending" | "success" | "failed" | "dead_letter";
  attempt_count: number;
  created_at: string;
  lead: { id: string; name: string | null; email: string | null } | null;
  destination: { id: string; name: string };
};

const statusFilters = ["all", "success", "pending", "failed", "dead_letter"] as const;

export default function DeliveriesPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [rows, setRows] = useState<DeliveryRow[]>([]);

  const load = useCallback(async () => {
    try {
      const response = await api.get("/deliveries", {
        params: {
          status: status === "all" ? undefined : status,
          limit: 200,
          offset: 0,
        },
      });
      if (response.data?.success) {
        setRows(response.data.data.items || []);
      }
    } catch (error) {
      logger.error("Failed to load deliveries", error);
    }
  }, [status]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timeout);
  }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const query = search.toLowerCase();
    return rows.filter((item) => {
      const leadName = item.lead?.name || item.lead?.email || "";
      return leadName.toLowerCase().includes(query) || item.destination.name.toLowerCase().includes(query);
    });
  }, [rows, search]);

  const replayOne = async (id: string) => {
    try {
      const response = await api.post(`/deliveries/${id}/replay`);
      if (response.data?.success) {
        toast.success(t("deliveries.scheduled"));
        await load();
      }
    } catch (error) {
      logger.error("Failed to replay delivery", error);
      toast.error(t("deliveries.replay_failed"));
    }
  };

  const replayBulk = async () => {
    try {
      const response = await api.post("/deliveries/replay-bulk", {
        status: status === "all" ? undefined : status,
        limit: 200,
      });
      if (response.data?.success) {
        toast.success(t("deliveries.bulk_scheduled", { count: response.data.data.replayed }));
        await load();
      }
    } catch (error) {
      logger.error("Failed to schedule bulk replay", error);
      toast.error(t("deliveries.bulk_failed"));
    }
  };

  const summary = useMemo(
    () => ({
      total: rows.length,
      success: rows.filter((item) => item.status === "success").length,
      failed: rows.filter((item) => item.status === "failed").length,
      dead_letter: rows.filter((item) => item.status === "dead_letter").length,
    }),
    [rows],
  );

  return (
    <AppLayout>
      <div className="p-4 md:p-6  space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t("deliveries.title")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t("deliveries.subtitle")}</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 h-8 text-[13px] w-full sm:w-auto" onClick={replayBulk}>
            <RotateCcw className="w-3.5 h-3.5" />
            {t("common.batch_replay")}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("deliveries.search_placeholder")}
              className="pl-9 h-9 text-[13px] bg-surface-2 border-border"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto">
            {statusFilters.map((item) => (
              <button
                key={item}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors duration-150",
                  status === item ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
                onClick={() => setStatus(item)}
              >
                {item === "dead_letter" ? "DLQ" : item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: t("common.total"), value: summary.total, cls: "text-foreground" },
            { label: t("common.success"), value: summary.success, cls: "text-success" },
            { label: t("common.failed"), value: summary.failed, cls: "text-destructive" },
            { label: "DLQ", value: summary.dead_letter, cls: "text-warning" },
          ].map((item) => (
            <div key={item.label} className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
              <p className={`text-xl font-semibold font-mono mt-1 ${item.cls}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("deliveries.id")}</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("deliveries.lead")}</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("deliveries.destination")}</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("deliveries.event")}</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("deliveries.status")}</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("deliveries.attempts")}</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("deliveries.created")}</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("deliveries.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors duration-150">
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-mono text-muted-foreground">{row.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      {row.lead ? (
                        <Link href={`/leads/${row.lead.id}`} className="text-[13px] text-primary hover:underline">
                          {row.lead.name || row.lead.email || row.lead.id}
                        </Link>
                      ) : (
                        <span className="text-[13px] text-muted-foreground">{t("common.unknown")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-foreground">{row.destination.name}</td>
                    <td className="px-4 py-3 text-[12px] font-mono text-muted-foreground">{row.event_type}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-[12px] font-mono text-muted-foreground">{row.attempt_count}/50</td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground">{new Date(row.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {row.status === "failed" || row.status === "dead_letter" ? (
                          <Button variant="ghost" size="sm" className="h-7 text-[12px] text-primary gap-1" onClick={() => replayOne(row.id)}>
                            <RotateCcw className="w-3 h-3" />
                            {t("common.replay")}
                          </Button>
                        ) : null}
                        {row.lead ? (
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <Link href={`/leads/${row.lead.id}`}>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
