"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Key, Plus } from "lucide-react";
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

type SourceRecord = {
  id: string;
  name: string;
  type: string;
  environment: "production" | "staging" | "development";
  rate_limit_per_min: number;
  status: "active" | "inactive";
  updated_at: string;
  _count: {
    ingestions: number;
  };
};

export default function SourcesPage() {
  const [tab, setTab] = useState<"installed" | "browse">("installed");
  const [rows, setRows] = useState<SourceRecord[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "webhook",
    rate_limit_per_min: 100,
  });

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
    void loadSources();
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

  const createSource = async () => {
    setIsCreating(true);
    try {
      const create = await api.post("/sources", form);
      if (!create.data?.success) {
        return;
      }

      const sourceId = create.data.data.id as string;
      const keyResponse = await api.post(`/sources/${sourceId}/keys`, {
        name: `${form.name} key`,
      });
      const plainKey = keyResponse.data?.data?.plain_key as string | undefined;
      setGeneratedKey(plainKey || null);
      toast.success("Source created");
      await loadSources();
    } catch (error) {
      logger.error("Failed to create source", error);
      toast.error("Failed to create source");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-[1200px] space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Sources</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage ingestion sources and API keys</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 h-8 text-[13px]">
                <Plus className="w-3.5 h-3.5" />
                New source
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create source</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Configure a new ingestion source and generate an API key.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-[13px] font-medium text-foreground">Name</label>
                  <Input
                    placeholder="Example: LP Black Friday"
                    className="mt-1.5 h-9 text-[13px]"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-foreground">Type</label>
                  <Input
                    placeholder="webhook"
                    className="mt-1.5 h-9 text-[13px]"
                    value={form.type}
                    onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-foreground">Rate limit (req/min)</label>
                  <Input
                    type="number"
                    min={1}
                    max={20000}
                    className="mt-1.5 h-9 text-[13px]"
                    value={form.rate_limit_per_min}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        rate_limit_per_min: Number(event.target.value || 100),
                      }))
                    }
                  />
                </div>

                <Button className="w-full h-9 text-[13px]" onClick={createSource} disabled={isCreating || !form.name.trim()}>
                  {isCreating ? "Creating..." : "Create source"}
                </Button>

                {generatedKey ? (
                  <div className="p-4 bg-surface-2 rounded-xl border border-border space-y-2">
                    <div className="flex items-center gap-2 text-warning">
                      <Key className="w-4 h-4" />
                      <span className="text-[12px] font-medium">Copy this key now. It will not be shown again.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-[11px] font-mono bg-background p-2 rounded-lg text-foreground break-all border border-border">
                        {generatedKey}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedKey);
                          toast.success("API key copied");
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : null}
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
            emptyTitle="No source configured"
            emptyDescription="Create your first source or browse the catalog."
            onBrowse={() => setTab("browse")}
          />
        ) : (
          <IntegrationGrid filterDirection="source" />
        )}
      </div>
    </AppLayout>
  );
}
