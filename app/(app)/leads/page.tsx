"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Mail, Phone, Search } from "lucide-react";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/i18n-context";

type LeadItem = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  tags_json: unknown;
  created_at: string;
  identities: Array<{ id: string; type: string; value: string }>;
  _count: {
    deliveries: number;
  };
};

const statusFilters = ["all", "new", "contacted", "qualified", "won", "lost", "needs_identity"] as const;

export default function LeadsPage() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [rows, setRows] = useState<LeadItem[]>([]);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isSendingExportEmail, setIsSendingExportEmail] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const response = await api.get("/leads", {
        params: {
          query: query || undefined,
          status: status === "all" ? undefined : status,
          limit: 100,
          offset: 0,
        },
      });

      if (response.data?.success) {
        setRows(response.data.data.items || []);
      }
    } catch (error) {
      logger.error("Failed to load leads", error);
    }
  }, [query, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchLeads();
    }, 200);

    return () => clearTimeout(timer);
  }, [fetchLeads]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchLeads();
    }, 0);
    return () => clearTimeout(timeout);
  }, [fetchLeads]);

  const total = useMemo(() => rows.length, [rows.length]);

  const currentFilters = useMemo(
    () => ({
      query: query || undefined,
      status: status === "all" ? undefined : status,
    }),
    [query, status],
  );

  const handleDownloadCsv = useCallback(async () => {
    try {
      setIsExportingCsv(true);
      const response = await api.get("/leads/export.csv", {
        params: currentFilters,
        responseType: "blob",
      });

      const contentDisposition = String(response.headers["content-disposition"] || "");
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/i);
      const filename = filenameMatch?.[1] || "leads.csv";
      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      logger.success(t("leads.export_started"));
    } catch (error) {
      logger.error(t("leads.export_failed"), error);
    } finally {
      setIsExportingCsv(false);
    }
  }, [currentFilters, t]);

  const handleSendExportEmail = useCallback(async () => {
    try {
      setIsSendingExportEmail(true);
      await api.post("/leads/export/email", currentFilters);
      logger.success(t("leads.export_email_sent"));
    } catch (error) {
      logger.error(t("leads.export_email_failed"), error);
    } finally {
      setIsSendingExportEmail(false);
    }
  }, [currentFilters, t]);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-[1200px] space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t("leads.title")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("leads.subtitle", { count: total.toLocaleString() })}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="h-9 text-[13px]" onClick={() => void handleDownloadCsv()} disabled={isExportingCsv}>
              <Download className="h-4 w-4" />
              {isExportingCsv ? t("leads.exporting") : t("leads.export_csv")}
            </Button>
            <Button className="h-9 text-[13px]" onClick={() => void handleSendExportEmail()} disabled={isSendingExportEmail}>
              <Mail className="h-4 w-4" />
              {isSendingExportEmail ? t("leads.sending_export_email") : t("leads.export_email")}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("leads.search_placeholder")}
              className="pl-9 h-9 text-[13px] bg-surface-2 border-border"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
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
                {item === "all" ? t("leads.all") : item}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("leads.lead")}</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("leads.identities")}</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("leads.status")}</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("leads.tags")}</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("leads.deliveries")}</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("leads.created")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((lead) => {
                  const tags = Array.isArray(lead.tags_json) ? (lead.tags_json as string[]) : [];

                  return (
                    <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors duration-150">
                      <td className="px-4 py-3">
                        <Link href={`/leads/${lead.id}`} className="block">
                          <p className="text-[13px] font-medium text-foreground hover:underline">{lead.name || t("leads.unnamed")}</p>
                          <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{lead.id}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {lead.email ? (
                            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {lead.email}
                            </div>
                          ) : null}
                          {lead.phone ? (
                            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              {lead.phone}
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {tags.length ? (
                            tags.map((tag) => (
                              <span key={tag} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] bg-accent text-accent-foreground">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-muted-foreground">{t("leads.no_tags")}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[12px] font-mono text-muted-foreground">{lead._count.deliveries}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] text-muted-foreground">{new Date(lead.created_at).toLocaleString()}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
