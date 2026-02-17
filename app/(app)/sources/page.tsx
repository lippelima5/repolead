"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { InstalledList, InstalledIntegrationItem, InstalledListAction } from "@/components/integrations/installed-list";
import { IntegrationGrid } from "@/components/integrations/integration-grid";
import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/i18n-context";

type SourceRecord = {
  id: string;
  name: string;
  type: string;
  environment: "production" | "staging" | "development";
  rate_limit_per_min: number;
  status: "active" | "inactive";
  integration_id: string;
  updated_at: string;
  _count: {
    ingestions: number;
  };
};

export default function SourcesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [tab, setTab] = useState<"installed" | "browse">(() => (searchParams.get("tab") === "browse" ? "browse" : "installed"));
  const [rows, setRows] = useState<SourceRecord[]>([]);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<{ sourceName: string; plainKey: string } | null>(null);

  const loadSources = async () => {
    try {
      const response = await api.get("/sources", {
        params: { limit: 200, offset: 0 },
      });
      if (response.data?.success) {
        setRows(response.data.data.items || []);
      }
    } catch (error) {
      logger.error("Failed to load sources", error);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadSources();
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  const installedItems = useMemo<InstalledIntegrationItem[]>(
    () =>
      rows.map((item) => ({
        id: item.id,
        name: item.name,
        status: item.status === "active" ? "connected" : "disabled",
        last_activity: item.updated_at,
        events_today: item._count.ingestions,
        direction: "source",
      })),
    [rows],
  );

  const toggleSourceStatus = async (sourceId: string, current: "active" | "inactive") => {
    try {
      const next = current === "active" ? "inactive" : "active";
      const response = await api.patch(`/sources/${sourceId}`, { status: next });
      if (response.data?.success) {
        toast.success(next === "active" ? t("sources.enabled_success") : t("sources.disabled_success"));
        await loadSources();
      }
    } catch (error) {
      logger.error("Failed to toggle source status", error);
      toast.error(t("sources.toggle_failed"));
    }
  };

  const deleteSource = async (sourceId: string, sourceName: string) => {
    if (!window.confirm(t("sources.delete_confirm", { name: sourceName }))) {
      return;
    }

    try {
      const response = await api.delete(`/sources/${sourceId}`);
      if (response.data?.success) {
        toast.success(t("sources.deleted_success"));
        await loadSources();
      }
    } catch (error) {
      logger.error("Failed to delete source", error);
      toast.error(t("sources.deleted_failed"));
    }
  };

  const createSourceKey = async (sourceId: string, sourceName: string) => {
    try {
      const response = await api.post(`/sources/${sourceId}/keys`, {
        name: `${sourceName} key`,
      });
      if (response.data?.success) {
        const plainKey = response.data.data.plain_key as string;
        setGeneratedKey({ sourceName, plainKey });
        setShowKeyDialog(true);
        toast.success(t("sources.key_created"));
      }
    } catch (error) {
      logger.error("Failed to create source key", error);
      toast.error(t("sources.key_failed"));
    }
  };

  const getSourceActions = (item: InstalledIntegrationItem): InstalledListAction[] => {
    const source = rows.find((row) => row.id === item.id);
    if (!source) {
      return [];
    }

    return [
      {
        label: t("common.configure"),
        onSelect: () => {
          router.push(`/sources/configure/${source.integration_id}?sourceId=${source.id}&returnTo=${encodeURIComponent("/sources")}`);
        },
      },
      {
        label: t("sources.action_generate_key"),
        onSelect: () => {
          void createSourceKey(source.id, source.name);
        },
      },
      {
        label: t("sources.action_view_ingestions"),
        onSelect: () => {
          router.push(`/ingestions?sourceId=${source.id}`);
        },
      },
      {
        label: source.status === "active" ? t("common.disable") : t("common.enable"),
        separatorBefore: true,
        onSelect: () => {
          void toggleSourceStatus(source.id, source.status);
        },
      },
      {
        label: t("common.delete"),
        destructive: true,
        onSelect: () => {
          void deleteSource(source.id, source.name);
        },
      },
    ];
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-[1200px] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t("sources.title")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t("sources.subtitle")}</p>
          </div>
          <Button size="sm" className="gap-2 h-8 text-[13px] w-full sm:w-auto" onClick={() => setTab("browse")}>
            <Plus className="w-3.5 h-3.5" />
            {t("sources.new")}
          </Button>
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
                "px-3 pb-2.5 pt-1 text-[13px] font-medium border-b-2 transition-colors duration-150 -mb-px whitespace-nowrap",
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
            emptyTitle={t("sources.empty_title")}
            emptyDescription={t("sources.empty_description")}
            onBrowse={() => setTab("browse")}
            getActions={getSourceActions}
          />
        ) : (
          <IntegrationGrid filterDirection="source" configureBasePath="/sources/configure" returnTo="/sources?tab=browse" />
        )}
      </div>

      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{t("sources.key_dialog_title")}</DialogTitle>
            <DialogDescription>
              {generatedKey?.sourceName ? `${t("sources.key_dialog_description")} (${generatedKey.sourceName})` : t("sources.key_dialog_description")}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border bg-surface-2 p-3 space-y-2">
            <p className="text-[12px] text-warning">{t("integrations.copy_key_now")}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-md border border-border bg-background px-3 py-2 text-[11px]">
                {generatedKey?.plainKey || ""}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!generatedKey?.plainKey) return;
                  navigator.clipboard.writeText(generatedKey.plainKey);
                  toast.success(t("integrations.key_copied"));
                }}
              >
                {t("common.copy")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

