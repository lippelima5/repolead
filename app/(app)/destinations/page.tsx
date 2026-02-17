"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { InstalledList, InstalledIntegrationItem } from "@/components/integrations/installed-list";
import { IntegrationGrid } from "@/components/integrations/integration-grid";
import { cn } from "@/lib/utils";

type DestinationRecord = {
  id: string;
  name: string;
  url: string;
  method: "post" | "put" | "patch";
  enabled: boolean;
  updated_at: string;
};

export default function DestinationsPage() {
  const [tab, setTab] = useState<"installed" | "browse">("installed");
  const [rows, setRows] = useState<DestinationRecord[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [form, setForm] = useState({
    name: "",
    url: "",
    method: "post" as "post" | "put" | "patch",
    signing_secret: "",
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
    void loadDestinations();
  }, []);

  const installedItems = useMemo<InstalledIntegrationItem[]>(
    () =>
      rows.map((item) => ({
        id: item.id,
        name: item.name,
        status: item.enabled ? "connected" : "disabled",
        last_activity: item.updated_at,
        events_today: 0,
        direction: "destination",
      })),
    [rows],
  );

  const createDestination = async () => {
    setIsCreating(true);
    try {
      const response = await api.post("/destinations", {
        ...form,
        subscribed_events_json: ["lead_created", "lead_updated"],
      });
      if (response.data?.success) {
        toast.success("Destination created");
        setShowCreateDialog(false);
        setForm({ name: "", url: "", method: "post", signing_secret: "" });
        await loadDestinations();
      }
    } catch (error) {
      logger.error("Failed to create destination", error);
      toast.error("Failed to create destination");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-[1200px] space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Destinations</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage outgoing delivery destinations</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 h-8 text-[13px]">
                <Plus className="w-3.5 h-3.5" />
                New destination
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create destination</DialogTitle>
                <DialogDescription className="text-muted-foreground">Configure webhook endpoint and subscription events.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-[13px] font-medium text-foreground">Name</label>
                  <Input
                    placeholder="CRM Webhook"
                    className="mt-1.5 h-9 text-[13px]"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-foreground">URL</label>
                  <Input
                    placeholder="https://example.com/webhook"
                    className="mt-1.5 h-9 text-[13px]"
                    value={form.url}
                    onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-foreground">Signing secret (optional)</label>
                  <Input
                    placeholder="lv_whsec_..."
                    className="mt-1.5 h-9 text-[13px]"
                    value={form.signing_secret}
                    onChange={(event) => setForm((prev) => ({ ...prev, signing_secret: event.target.value }))}
                  />
                </div>

                <Button
                  className="w-full h-9 text-[13px]"
                  onClick={createDestination}
                  disabled={isCreating || !form.name.trim() || !form.url.trim()}
                >
                  {isCreating ? "Creating..." : "Create destination"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
            emptyTitle="No destination configured"
            emptyDescription="Create your first destination or browse the catalog."
            onBrowse={() => setTab("browse")}
          />
        ) : (
          <IntegrationGrid filterDirection="destination" />
        )}
      </div>
    </AppLayout>
  );
}
