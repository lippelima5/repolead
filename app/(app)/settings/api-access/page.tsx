"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, RefreshCcw, ShieldCheck, ShieldOff } from "lucide-react";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { formatDate } from "@/lib/utils";

type WorkspaceReadKey = {
  id: string;
  name: string;
  prefix: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export default function ApiAccessSettingsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const workspaceId = user?.workspace_active_id ?? null;
  const [items, setItems] = useState<WorkspaceReadKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [plainKey, setPlainKey] = useState<string | null>(null);

  const activeCount = useMemo(() => items.filter((item) => !item.revoked_at).length, [items]);

  const loadKeys = useCallback(async () => {
    if (!workspaceId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/workspaces/${workspaceId}/read-keys`);
      if (response.data?.success) {
        setItems(response.data.data || []);
      }
    } catch (error) {
      logger.error(t("settings.api_access_load_failed"), error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, t]);

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  const copyPlainKey = useCallback(async () => {
    if (!plainKey) {
      return;
    }

    await navigator.clipboard.writeText(plainKey);
    logger.success(t("settings.api_access_key_copied"));
  }, [plainKey, t]);

  const createKey = useCallback(async () => {
    if (!workspaceId) {
      return;
    }

    try {
      setIsCreating(true);
      const response = await api.post(`/workspaces/${workspaceId}/read-keys`, {
        name: nameInput.trim() || undefined,
      });

      if (response.data?.success) {
        setPlainKey(response.data.data.plain_key || null);
        setNameInput("");
        logger.success(t("settings.api_access_created"));
        await loadKeys();
      }
    } catch (error) {
      logger.error(t("settings.api_access_create_failed"), error);
    } finally {
      setIsCreating(false);
    }
  }, [workspaceId, nameInput, t, loadKeys]);

  const rotateKey = useCallback(
    async (keyId: string) => {
      if (!workspaceId) {
        return;
      }

      try {
        const response = await api.post(`/workspaces/${workspaceId}/read-keys/${keyId}/rotate`);
        if (response.data?.success) {
          setPlainKey(response.data.data.plain_key || null);
          logger.success(t("settings.api_access_rotated"));
          await loadKeys();
        }
      } catch (error) {
        logger.error(t("settings.api_access_rotate_failed"), error);
      }
    },
    [workspaceId, t, loadKeys],
  );

  const revokeKey = useCallback(
    async (keyId: string) => {
      if (!workspaceId) {
        return;
      }

      try {
        await api.post(`/workspaces/${workspaceId}/read-keys/${keyId}/revoke`);
        logger.success(t("settings.api_access_revoked"));
        await loadKeys();
      } catch (error) {
        logger.error(t("settings.api_access_revoke_failed"), error);
      }
    },
    [workspaceId, t, loadKeys],
  );

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-[1100px] space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("settings.api_access")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("settings.api_access_subtitle", { count: activeCount })}
          </p>
        </div>

        {plainKey ? (
          <section className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">{t("settings.api_access_key_once")}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input readOnly value={plainKey} className="font-mono text-[12px]" />
              <Button variant="outline" className="h-9 text-[13px]" onClick={() => void copyPlainKey()}>
                <Copy className="h-4 w-4" />
                {t("common.copy")}
              </Button>
            </div>
          </section>
        ) : null}

        <section className="bg-card border border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">{t("settings.api_access_create")}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder={t("settings.api_access_name_placeholder")}
              className="h-9 text-[13px]"
            />
            <Button className="h-9 text-[13px]" disabled={isCreating || !workspaceId} onClick={() => void createKey()}>
              {isCreating ? t("common.loading") : t("settings.api_access_generate")}
            </Button>
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">
                    {t("common.name")}
                  </th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">
                    Prefix
                  </th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">
                    {t("common.status")}
                  </th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">
                    {t("common.last_activity")}
                  </th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-4 text-[13px] text-muted-foreground" colSpan={5}>
                      {t("common.loading")}
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-[13px] text-muted-foreground" colSpan={5}>
                      {t("settings.api_access_empty")}
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const isRevoked = Boolean(item.revoked_at);
                    return (
                      <tr key={item.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <p className="text-[13px] font-medium text-foreground">{item.name}</p>
                          <p className="text-[11px] text-muted-foreground">{formatDate(item.created_at)}</p>
                        </td>
                        <td className="px-4 py-3 text-[12px] font-mono text-muted-foreground">{item.prefix}</td>
                        <td className="px-4 py-3">
                          {isRevoked ? (
                            <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                              <ShieldOff className="h-3.5 w-3.5" />
                              {t("settings.api_access_revoked_status")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[12px] text-foreground">
                              <ShieldCheck className="h-3.5 w-3.5 text-success" />
                              {t("settings.api_access_active_status")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-muted-foreground">
                          {item.last_used_at ? formatDate(item.last_used_at) : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-[12px]"
                              onClick={() => void rotateKey(item.id)}
                              disabled={isRevoked}
                            >
                              <RefreshCcw className="h-3.5 w-3.5" />
                              {t("settings.api_access_rotate")}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-[12px] text-destructive hover:text-destructive"
                              onClick={() => void revokeKey(item.id)}
                              disabled={isRevoked}
                            >
                              {t("settings.api_access_revoke")}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
