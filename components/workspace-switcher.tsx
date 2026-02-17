"use client";

import { useEffect, useMemo, useState } from "react";
import { Building, Check, ChevronDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type WorkspaceOption = {
  workspace_id: number;
  role: "owner" | "admin" | "user" | "viewer";
  workspace: {
    id: number;
    name: string;
    slug: string | null;
  };
};

export function WorkspaceSwitcher() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const [items, setItems] = useState<WorkspaceOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/workspaces");
        if (data?.success) {
          setItems(data.data as WorkspaceOption[]);
        }
      } catch (error) {
        logger.error("Failed to load workspaces", error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const selected = useMemo(() => items.find((item) => item.workspace_id === user?.workspace_active_id) || null, [items, user]);

  const changeWorkspace = async (workspaceId: number) => {
    try {
      const { data } = await api.put("/profile", { workspace_active_id: workspaceId });
      if (data?.success) {
        window.localStorage.setItem("leadvault.workspace_id", String(workspaceId));
        window.location.reload();
      }
    } catch (error) {
      logger.error("Failed to change workspace", error);
    }
  };

  useEffect(() => {
    if (selected?.workspace_id) {
      window.localStorage.setItem("leadvault.workspace_id", String(selected.workspace_id));
    }
  }, [selected?.workspace_id]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-9 w-full justify-between rounded-lg border border-border bg-background px-2.5 text-left",
            "hover:bg-accent/50",
          )}
          disabled={loading}
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Building className="h-3.5 w-3.5" />
            </span>
            <span className="truncate text-[12px] font-medium">{selected?.workspace?.name || t("sidebar.select_workspace")}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        {items.map((item) => (
          <DropdownMenuItem key={item.workspace_id} onSelect={() => changeWorkspace(item.workspace_id)} className="text-[12px]">
            <Building className="h-3.5 w-3.5" />
            <span className="flex-1 truncate">{item.workspace.name}</span>
            {selected?.workspace_id === item.workspace_id ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-[12px]" onSelect={() => router.push("/settings")}>
          <Plus className="h-3.5 w-3.5" />
          {t("sidebar.manage_workspaces")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
