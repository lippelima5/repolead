"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { StatusBadge } from "@/components/status-badge";
import { useI18n } from "@/contexts/i18n-context";

type AlertRule = {
  id: string;
  type: "error_spike" | "silent_source";
  enabled: boolean;
  config_json: Record<string, unknown>;
  created_at: string;
};

type AlertEvent = {
  id: string;
  triggered_at: string;
  payload_json: Record<string, unknown>;
  rule: {
    id: string;
    type: string;
  };
};

export default function AlertsPage() {
  const { t } = useI18n();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [newRuleType, setNewRuleType] = useState<"error_spike" | "silent_source">("error_spike");
  const [newThreshold, setNewThreshold] = useState("5");

  const load = useCallback(async () => {
    try {
      const [rulesResponse, eventsResponse] = await Promise.all([api.get("/alerts/rules"), api.get("/alerts/events")]);
      if (rulesResponse.data?.success) {
        setRules(rulesResponse.data.data);
      }
      if (eventsResponse.data?.success) {
        setEvents(eventsResponse.data.data);
      }
    } catch (error) {
      logger.error("Failed to load alerts", error);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timeout);
  }, [load]);

  const createRule = async () => {
    try {
      const configKey = newRuleType === "error_spike" ? "threshold_percent" : "minutes_without_events";
      const response = await api.post("/alerts/rules", {
        type: newRuleType,
        enabled: true,
        config_json: {
          [configKey]: Number(newThreshold || 0),
        },
      });

      if (response.data?.success) {
        toast.success(t("alerts.rule_created"));
        await load();
      }
    } catch (error) {
      logger.error("Failed to create alert rule", error);
      toast.error(t("alerts.rule_create_failed"));
    }
  };

  const removeRule = async (ruleId: string) => {
    try {
      const response = await api.delete("/alerts/rules", {
        params: { ruleId },
      });
      if (response.data?.success) {
        toast.success(t("alerts.rule_deleted"));
        await load();
      }
    } catch (error) {
      logger.error("Failed to delete alert rule", error);
      toast.error(t("alerts.rule_delete_failed"));
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-[1200px] space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("alerts.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("alerts.subtitle")}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-[12px] font-medium text-foreground">{t("alerts.rule_type")}</label>
            <select
              className="mt-1 h-9 rounded-md border border-border bg-background px-2 text-[13px]"
              value={newRuleType}
              onChange={(event) => setNewRuleType(event.target.value as "error_spike" | "silent_source")}
            >
              <option value="error_spike">error_spike</option>
              <option value="silent_source">silent_source</option>
            </select>
          </div>
          <div>
            <label className="text-[12px] font-medium text-foreground">{t("alerts.threshold")}</label>
            <Input className="mt-1 h-9 text-[13px]" value={newThreshold} onChange={(event) => setNewThreshold(event.target.value)} />
          </div>
          <Button className="h-9 text-[13px] gap-2" onClick={createRule}>
            <Plus className="w-3.5 h-3.5" />
            {t("alerts.add_rule")}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface-2">
              <h2 className="text-[13px] font-semibold text-foreground">{t("alerts.rules")}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("alerts.rule_type")}</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("common.status")}</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Config</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider" />
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-[12px] font-mono text-foreground">{rule.type}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={rule.enabled ? "active" : "inactive"} label={rule.enabled ? "enabled" : "disabled"} />
                      </td>
                      <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{JSON.stringify(rule.config_json)}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeRule(rule.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface-2">
              <h2 className="text-[13px] font-semibold text-foreground">{t("alerts.recent_events")}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("alerts.rule_type")}</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("alerts.triggered")}</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("alerts.payload")}</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-[12px] font-mono text-foreground">{event.rule.type}</td>
                      <td className="px-4 py-3 text-[12px] text-muted-foreground">{new Date(event.triggered_at).toLocaleString()}</td>
                      <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{JSON.stringify(event.payload_json)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
