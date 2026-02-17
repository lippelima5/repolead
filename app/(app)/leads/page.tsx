"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, Phone, Search } from "lucide-react";
import AppLayout from "@/components/app-layout";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

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
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [rows, setRows] = useState<LeadItem[]>([]);

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

  return (
    <AppLayout>
      <div className="p-6 max-w-[1200px] space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total.toLocaleString()} leads in workspace</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by email, phone or name..."
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
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Lead</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Identities</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Status</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Tags</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Deliveries</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((lead) => {
                  const tags = Array.isArray(lead.tags_json) ? (lead.tags_json as string[]) : [];

                  return (
                    <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors duration-150">
                      <td className="px-4 py-3">
                        <Link href={`/leads/${lead.id}`} className="block">
                          <p className="text-[13px] font-medium text-foreground hover:underline">{lead.name || "Unnamed lead"}</p>
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
                          {tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] bg-accent text-accent-foreground">
                              {tag}
                            </span>
                          ))}
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
