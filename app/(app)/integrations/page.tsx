"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/app-layout";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { cn } from "@/lib/utils";
import { InstalledList, InstalledIntegrationItem } from "@/components/integrations/installed-list";
import { IntegrationGrid } from "@/components/integrations/integration-grid";

type InstalledResponse = {
  sources: Array<{ id: string; name: string; status: "connected" | "needs_attention" | "disabled"; last_activity: string; events_today: number }>;
  destinations: Array<{ id: string; name: string; status: "connected" | "needs_attention" | "disabled"; last_activity: string; events_today: number }>;
};

export default function IntegrationsPage() {
  const [tab, setTab] = useState<"installed" | "browse">("installed");
  const [data, setData] = useState<InstalledResponse>({ sources: [], destinations: [] });

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
      <div className="p-6 max-w-[1200px] space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Integrations Hub</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Installed integrations and browse catalog</p>
        </div>

        <div className="flex items-center gap-1 border-b border-border">
          {[
            { key: "installed" as const, label: "Installed", count: installedItems.length },
            { key: "browse" as const, label: "Browse" },
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
            emptyTitle="No integrations installed"
            emptyDescription="Browse the catalog and connect your first source or destination."
            onBrowse={() => setTab("browse")}
          />
        ) : (
          <IntegrationGrid />
        )}
      </div>
    </AppLayout>
  );
}
