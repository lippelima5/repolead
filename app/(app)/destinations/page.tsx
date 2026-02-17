"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { InstalledList, InstalledIntegrationItem, InstalledListAction } from "@/components/integrations/installed-list";
import { IntegrationGrid } from "@/components/integrations/integration-grid";
import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/i18n-context";

type DestinationRecord = {
  id: string;
  name: string;
  url: string;
  method: "post" | "put" | "patch";
  enabled: boolean;
  updated_at: string;
  _count: {
    deliveries: number;
  };
};

export default function DestinationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [tab, setTab] = useState<"installed" | "browse">(() => (searchParams.get("tab") === "browse" ? "browse" : "installed"));
  const [rows, setRows] = useState<DestinationRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingDestinationId, setEditingDestinationId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    url: string;
    method: "post" | "put" | "patch";
    enabled: boolean;
    subscribedEvents: string;
    signingSecret: string;
  }>({
    name: "",
    url: "",
    method: "post",
    enabled: true,
    subscribedEvents: "lead_created, lead_updated",
    signingSecret: "",
  });

  const loadDestinations = async () => {
    try {
      const response = await api.get("/destinations", {
        params: { limit: 200, offset: 0 },
      });
      if (response.data?.success) {
        setRows(response.data.data.items || []);
      }
    } catch (error) {
      logger.error("Failed to load destinations", error);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadDestinations();
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  const installedItems = useMemo<InstalledIntegrationItem[]>(
    () =>
      rows.map((item) => ({
        id: item.id,
        name: item.name,
        status: item.enabled ? "connected" : "disabled",
        last_activity: item.updated_at,
        events_today: item._count.deliveries,
        direction: "destination",
      })),
    [rows],
  );

  const openEditDestination = async (destinationId: string) => {
    try {
      const response = await api.get(`/destinations/${destinationId}`);
      if (!response.data?.success) {
        return;
      }

      const item = response.data.data as {
        id: string;
        name: string;
        url: string;
        method: "post" | "put" | "patch";
        enabled: boolean;
        subscribed_events_json: string[] | null;
      };

      setEditForm({
        name: item.name,
        url: item.url,
        method: item.method,
        enabled: item.enabled,
        subscribedEvents: (item.subscribed_events_json || []).join(", "),
        signingSecret: "",
      });
      setEditingDestinationId(destinationId);
    } catch (error) {
      logger.error("Failed to load destination details", error);
      toast.error(t("destinations.load_failed"));
    }
  };

  const saveDestination = async () => {
    if (!editingDestinationId) {
      return;
    }

    const events = editForm.subscribedEvents
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setIsSaving(true);
    try {
      const response = await api.patch(`/destinations/${editingDestinationId}`, {
        name: editForm.name,
        url: editForm.url,
        method: editForm.method,
        enabled: editForm.enabled,
        subscribed_events_json: events,
        ...(editForm.signingSecret.trim() ? { signing_secret: editForm.signingSecret.trim() } : {}),
      });
      if (response.data?.success) {
        toast.success(t("destinations.updated_success"));
        setEditingDestinationId(null);
        await loadDestinations();
      }
    } catch (error) {
      logger.error("Failed to update destination", error);
      toast.error(t("destinations.updated_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDestinationStatus = async (destinationId: string, enabled: boolean) => {
    try {
      const response = await api.patch(`/destinations/${destinationId}`, { enabled: !enabled });
      if (response.data?.success) {
        toast.success(!enabled ? t("destinations.enabled_success") : t("destinations.disabled_success"));
        await loadDestinations();
      }
    } catch (error) {
      logger.error("Failed to toggle destination", error);
      toast.error(t("destinations.toggle_failed"));
    }
  };

  const deleteDestination = async (destinationId: string, destinationName: string) => {
    if (!window.confirm(t("destinations.delete_confirm", { name: destinationName }))) {
      return;
    }

    try {
      const response = await api.delete(`/destinations/${destinationId}`);
      if (response.data?.success) {
        toast.success(t("destinations.deleted_success"));
        await loadDestinations();
      }
    } catch (error) {
      logger.error("Failed to delete destination", error);
      toast.error(t("destinations.deleted_failed"));
    }
  };

  const testDestination = async (destinationId: string) => {
    try {
      const response = await api.post(`/destinations/${destinationId}/test`, {
        event_type: "test_event",
        payload: {
          lead: { email: "test@leadvault.dev", name: "Destination Test" },
          source: "manual_test",
        },
      });
      if (response.data?.success) {
        toast.success(t("destinations.test_success"));
      }
    } catch (error) {
      logger.error("Failed to test destination", error);
      toast.error(t("destinations.test_failed"));
    }
  };

  const getDestinationActions = (item: InstalledIntegrationItem): InstalledListAction[] => {
    const destination = rows.find((row) => row.id === item.id);
    if (!destination) {
      return [];
    }

    return [
      {
        label: t("common.edit"),
        onSelect: () => {
          void openEditDestination(destination.id);
        },
      },
      {
        label: t("common.test"),
        onSelect: () => {
          void testDestination(destination.id);
        },
      },
      {
        label: t("destinations.action_view_deliveries"),
        onSelect: () => {
          router.push("/deliveries");
        },
      },
      {
        label: destination.enabled ? t("common.disable") : t("common.enable"),
        separatorBefore: true,
        onSelect: () => {
          void toggleDestinationStatus(destination.id, destination.enabled);
        },
      },
      {
        label: t("common.delete"),
        destructive: true,
        onSelect: () => {
          void deleteDestination(destination.id, destination.name);
        },
      },
    ];
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-[1200px] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t("destinations.title")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t("destinations.subtitle")}</p>
          </div>
          <Button size="sm" className="gap-2 h-8 text-[13px] w-full sm:w-auto" onClick={() => setTab("browse")}>
            <Plus className="w-3.5 h-3.5" />
            {t("destinations.new")}
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
            emptyTitle={t("destinations.empty_title")}
            emptyDescription={t("destinations.empty_description")}
            onBrowse={() => setTab("browse")}
            getActions={getDestinationActions}
          />
        ) : (
          <IntegrationGrid
            filterDirection="destination"
            configureBasePath="/destinations/configure"
            returnTo="/destinations?tab=browse"
          />
        )}
      </div>

      <Dialog open={Boolean(editingDestinationId)} onOpenChange={(open) => (!open ? setEditingDestinationId(null) : undefined)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{t("destinations.edit_title")}</DialogTitle>
            <DialogDescription>{t("destinations.edit_description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-foreground">{t("common.name")}</label>
              <Input
                value={editForm.name}
                onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                className="h-9 text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-foreground">{t("integrations.destination_url")}</label>
              <Input
                value={editForm.url}
                onChange={(event) => setEditForm((prev) => ({ ...prev, url: event.target.value }))}
                className="h-9 text-[13px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-foreground">{t("integrations.destination_method")}</label>
                <select
                  className="h-9 w-full text-[13px] rounded-md border border-border bg-background px-3 text-foreground"
                  value={editForm.method}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      method: event.target.value as "post" | "put" | "patch",
                    }))
                  }
                >
                  <option value="post">POST</option>
                  <option value="put">PUT</option>
                  <option value="patch">PATCH</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-foreground">{t("destinations.field_status")}</label>
                <select
                  className="h-9 w-full text-[13px] rounded-md border border-border bg-background px-3 text-foreground"
                  value={editForm.enabled ? "enabled" : "disabled"}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      enabled: event.target.value === "enabled",
                    }))
                  }
                >
                  <option value="enabled">{t("destinations.status_enabled")}</option>
                  <option value="disabled">{t("destinations.status_disabled")}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-foreground">{t("integrations.destination_events")}</label>
              <Input
                value={editForm.subscribedEvents}
                onChange={(event) => setEditForm((prev) => ({ ...prev, subscribedEvents: event.target.value }))}
                className="h-9 text-[13px]"
                placeholder="lead_created, lead_updated, delivery_failed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-foreground">{t("destinations.field_signing_secret")}</label>
              <Input
                value={editForm.signingSecret}
                onChange={(event) => setEditForm((prev) => ({ ...prev, signingSecret: event.target.value }))}
                className="h-9 text-[13px]"
                placeholder="lv_whsec_..."
              />
              <p className="text-[11px] text-muted-foreground">{t("destinations.signing_secret_hint")}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDestinationId(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={saveDestination} disabled={isSaving || !editForm.name.trim() || !editForm.url.trim()}>
              {isSaving ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
