"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import AppLayout from "@/components/app-layout";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { useI18n } from "@/contexts/i18n-context";

type IngestionRow = {
  id: string;
  source_id: string;
  source: { id: string; name: string; type: string };
  status: string;
  content_type: string | null;
  size_bytes: number;
  received_at: string;
  idempotency_key: string | null;
};

export default function IngestionsPage() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<IngestionRow[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const load = async () => {
        try {
          const response = await api.get("/ingestions", {
            params: {
              query: query || undefined,
              limit: 100,
              offset: 0,
            },
          });
          if (response.data?.success) {
            setRows(response.data.data.items || []);
          }
        } catch (error) {
          logger.error("Failed to load ingestions", error);
        }
      };

      void load();
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-[1200px] space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("ingestions.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("ingestions.subtitle")}</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("ingestions.search_placeholder")}
            className="pl-9 h-9 text-[13px] bg-surface-2 border-border"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("ingestions.ingest_id")}</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("ingestions.source")}</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("ingestions.status")}</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("ingestions.type")}</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("ingestions.size")}</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("ingestions.idempotency")}</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{t("ingestions.received")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors duration-150">
                    <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{row.id}</td>
                    <td className="px-4 py-3">
                      <div className="text-[13px] text-foreground">{row.source?.name || row.source_id}</div>
                      <div className="text-[11px] text-muted-foreground">{row.source?.type}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground">{row.content_type || "-"}</td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground">{row.size_bytes} bytes</td>
                    <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{row.idempotency_key || "-"}</td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground">{new Date(row.received_at).toLocaleString()}</td>
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
