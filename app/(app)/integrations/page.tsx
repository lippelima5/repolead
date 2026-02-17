"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppLayout from "@/components/app-layout";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { cn } from "@/lib/utils";
import { InstalledList, InstalledIntegrationItem } from "@/components/integrations/installed-list";
import { IntegrationGrid } from "@/components/integrations/integration-grid";
import { useI18n } from "@/contexts/i18n-context";
import { IntegrationDirection } from "@/content/integrations-catalog";

type InstalledResponse = {
  sources: Array<{ id: string; name: string; status: "connected" | "needs_attention" | "disabled"; last_activity: string; events_today: number }>;
  destinations: Array<{ id: string; name: string; status: "connected" | "needs_attention" | "disabled"; last_activity: string; events_today: number }>;
};

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [tab, setTab] = useState<"installed" | "browse">(() => (searchParams.get("tab") === "browse" ? "browse" : "installed"));
  const [data, setData] = useState<InstalledResponse>({ sources: [], destinations: [] });
  const filterDirection = searchParams.get("direction") as IntegrationDirection | null;

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/integrations/installed");
        if (response.data?.success) {
          setData(response.data.data);
        }
      } catch (error) {
        logger.error("Failed to load installed integrations", error);
      }
    };

    void load();
  }, []);

  const installedItems = useMemo<InstalledIntegrationItem[]>(
    () => [
      ...data.sources.map((item) => ({ ...item, direction: "source" as const })),
      ...data.destinations.map((item) => ({ ...item, direction: "destination" as const })),
    ],
    [data.destinations, data.sources],
  );

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-[1200px] space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("integrations.hub_title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("integrations.hub_subtitle")}</p>
        </div>

        <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
          {[
            { key: "installed" as const, label: t("common.installed"), count: installedItems.length },
            { key: "browse" as const, label: t("common.browse") },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={cn(
                "px-3 pb-2.5 pt-1 text-[13px] font-medium border-b-2 transition-colors duration-150 -mb-px",
                tab === item.key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
              {item.count !== undefined ? (
                <span className="ml-1.5 text-[11px] text-muted-foreground bg-surface-2 px-1.5 py-0.5 rounded-md">{item.count}</span>
              ) : null}
            </button>
          ))}
        </div>

        {tab === "installed" ? (
          <InstalledList
            items={installedItems}
            emptyTitle={t("integrations.empty_title")}
            emptyDescription={t("integrations.empty_description")}
            onBrowse={() => setTab("browse")}
          />
        ) : (
          <IntegrationGrid filterDirection={filterDirection ?? undefined} returnTo="/integrations" />
        )}
      </div>
    </AppLayout>
  );
}
