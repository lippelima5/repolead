"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle, Radio, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AppLayout from "@/components/app-layout";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { useI18n } from "@/contexts/i18n-context";

type OverviewResponse = {
  ingestions_today: number;
  ingestions_change: number;
  leads_total: number;
  leads_change: number;
  delivery_rate: number;
  dlq_count: number;
  deliveries_by_status: Array<{ status: string; count: number }>;
  ingestions_chart: Array<{ hour: string; count: number }>;
  top_sources: Array<{ source_id: string; name: string; count: number }>;
  recent_failures: Array<{
    id: string;
    status: string;
    lead?: { id: string; name: string | null; email: string | null } | null;
    destination: { id: string; name: string };
    last_error: string | null;
  }>;
};

export default function DashboardPage() {
  const { t } = useI18n();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await api.get("/metrics/overview");
        if (response.data?.success) {
          setData(response.data.data);
        }
      } catch (error) {
        logger.error("Failed to load metrics overview", error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const pieData = useMemo(() => data?.deliveries_by_status || [], [data?.deliveries_by_status]);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-[1200px] space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("dashboard.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("dashboard.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            title={t("dashboard.ingestions_today")}
            value={data?.ingestions_today?.toLocaleString() || "0"}
            change={data?.ingestions_change || 0}
            icon={Activity}
          />
          <MetricCard
            title={t("dashboard.total_leads")}
            value={data?.leads_total?.toLocaleString() || "0"}
            change={data?.leads_change || 0}
            icon={Users}
            iconClassName="bg-success/10 text-success"
          />
          <MetricCard
            title={t("dashboard.delivery_rate")}
            value={`${data?.delivery_rate || 0}%`}
            icon={CheckCircle}
            iconClassName="bg-primary/10 text-primary"
          />
          <MetricCard
            title={t("dashboard.dead_letter_queue")}
            value={data?.dlq_count || 0}
            icon={AlertTriangle}
            iconClassName="bg-warning/10 text-warning"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <h3 className="text-[13px] font-medium text-foreground mb-4">{t("dashboard.ingestions_by_hour")}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data?.ingestions_chart || []}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--popover-foreground)",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="hsl(239, 84%, 67%)" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-[13px] font-medium text-foreground mb-4">{t("dashboard.delivery_status")}</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="count" strokeWidth={0}>
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={["hsl(142, 71%, 45%)", "hsl(0, 84%, 60%)", "hsl(38, 92%, 50%)"][index] || "hsl(240,4%,50%)"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--popover-foreground)",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-1">
              {pieData.map((item, index) => (
                <div key={item.status} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: ["hsl(142, 71%, 45%)", "hsl(0, 84%, 60%)", "hsl(38, 92%, 50%)"][index] || "hsl(240,4%,50%)",
                      }}
                    />
                    <span className="text-muted-foreground capitalize">{item.status === "dead_letter" ? "DLQ" : item.status}</span>
                  </div>
                  <span className="text-foreground font-medium font-mono text-[11px]">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-[13px] font-medium text-foreground mb-4">{t("dashboard.top_sources_today")}</h3>
            <div className="space-y-3">
              {(data?.top_sources || []).map((source) => (
                <div key={source.source_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Radio className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[13px] text-foreground">{source.name}</span>
                  </div>
                  <span className="text-[13px] font-mono text-muted-foreground">{source.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-[13px] font-medium text-foreground mb-4">{t("dashboard.recent_failures")}</h3>
            <div className="space-y-3">
              {(data?.recent_failures || []).map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[13px] text-foreground">{delivery.lead?.name || delivery.lead?.email || t("common.unknown")}</p>
                    <p className="text-xs text-muted-foreground">{delivery.destination.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={delivery.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {loading ? <p className="text-xs text-muted-foreground">{t("dashboard.loading")}</p> : null}
      </div>
    </AppLayout>
  );
}
