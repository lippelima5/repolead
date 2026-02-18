"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CreditCard, Globe, KeyRound, Lock, Users } from "lucide-react";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { hasWorkspacePaidPlan } from "@/lib/workspace-plan";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { WorkspaceStatusName } from "@/lib/shared";
import { formatDate } from "@/lib/utils";

type WorkspaceData = {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  retention_days: number;
  idempotency_window_hours: number;
  plan_status: "active" | "trialing" | "pending" | "inactive" | "canceled" | "expired";
  stripe_subscription_id: string | null;
  plan_expires_at: string | null;
  users: Array<{
    user_id: number;
  }>;
  created_at: string;
  updated_at: string;
};

function ReadonlyItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-[13px] text-foreground">{value}</p>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const workspaceId = user?.workspace_active_id ?? null;
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadWorkspace = useCallback(async () => {
    if (!workspaceId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const workspaceResponse = await api.get(`/workspaces/${workspaceId}`);
      if (workspaceResponse.data?.success) {
        setWorkspace(workspaceResponse.data.data);
      }
    } catch (error) {
      logger.error("Failed to load settings data", error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const paymentLabel = useMemo(() => {
    if (!workspace) {
      return locale === "pt" ? "Pagamento" : "Billing";
    }

    return hasWorkspacePaidPlan(workspace)
      ? locale === "pt"
        ? "Gerenciar pagamento"
        : "Manage billing"
      : locale === "pt"
        ? "Assinar plano"
        : "Subscribe";
  }, [locale, workspace]);

  return (
    <AppLayout>
      <div className="p-4 md:p-6  space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("settings.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {locale === "pt"
              ? "Central de configuracoes do workspace ativo. Todos os campos abaixo sao somente leitura."
              : "Settings center for the active workspace. All fields below are read-only."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <section className="bg-card border border-border rounded-xl p-5 space-y-4 md:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  {t("settings.workspace")}
                </h2>
                <p className="text-[12px] text-muted-foreground mt-1">
                  {locale === "pt"
                    ? "Dados principais do workspace ativo."
                    : "Primary details of the active workspace."}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-[12px]"
                onClick={() => workspaceId && router.push(`/workspaces/${workspaceId}/edit`)}
                disabled={!workspaceId}
              >
                {t("common.edit")}
              </Button>
            </div>

            {isLoading ? (
              <p className="text-[13px] text-muted-foreground">{t("common.loading")}</p>
            ) : workspace ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <ReadonlyItem label={t("common.name")} value={workspace.name} />
                <ReadonlyItem label={t("settings.slug")} value={workspace.slug || "-"} />
                <ReadonlyItem label={t("common.status")} value={WorkspaceStatusName(workspace.plan_status) || "-"} />
                <ReadonlyItem label={t("settings.retention_days")} value={String(workspace.retention_days)} />
                <ReadonlyItem label={t("settings.idempotency_window")} value={String(workspace.idempotency_window_hours)} />
                <ReadonlyItem
                  label={t("settings.members")}
                  value={String(workspace.users?.length || 0)}
                />
                <ReadonlyItem
                  label={t("common.created_at")}
                  value={formatDate(workspace.created_at)}
                />
                <ReadonlyItem
                  label={locale === "pt" ? "Atualizado em" : "Updated at"}
                  value={formatDate(workspace.updated_at)}
                />
                <ReadonlyItem
                  label={locale === "pt" ? "Expira em" : "Expires at"}
                  value={workspace.plan_expires_at ? formatDate(workspace.plan_expires_at) : "-"}
                />
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                {locale === "pt" ? "Workspace nao encontrado." : "Workspace not found."}
              </p>
            )}
          </section>

          <section className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h2 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              {locale === "pt" ? "Pagamento" : "Billing"}
            </h2>
            <p className="text-[12px] text-muted-foreground">
              {locale === "pt"
                ? "Acesse a tela de assinatura do workspace para checkout e portal Stripe."
                : "Open workspace billing for checkout and Stripe portal."}
            </p>
            <Button
              size="sm"
              className="h-8 text-[12px] w-full"
              onClick={() => workspaceId && router.push(`/workspaces/${workspaceId}/billing`)}
              disabled={!workspaceId}
            >
              {paymentLabel}
            </Button>
          </section>

          <section className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h2 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              {t("settings.members")}
            </h2>
            <p className="text-[12px] text-muted-foreground">
              {locale === "pt"
                ? "Gerencie convites e membros direto na tela do workspace."
                : "Manage invites and members directly in the workspace page."}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[12px] w-full"
              onClick={() => workspaceId && router.push(`/workspaces/${workspaceId}`)}
              disabled={!workspaceId}
            >
              {locale === "pt" ? "Abrir workspace" : "Open workspace"}
            </Button>
          </section>

          <section className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h2 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              {t("settings.alerts")}
            </h2>
            <p className="text-[12px] text-muted-foreground">{t("settings.alerts_description")}</p>
            <Button size="sm" variant="outline" className="h-8 text-[12px] w-full" onClick={() => router.push("/alerts")}>
              {t("settings.open_alerts_center")}
            </Button>
          </section>

          <section className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h2 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              {t("settings.api_access")}
            </h2>
            <p className="text-[12px] text-muted-foreground">{t("settings.api_access_description")}</p>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[12px] w-full"
              onClick={() => router.push("/settings/api-access")}
            >
              {t("settings.open_api_access")}
            </Button>
          </section>

          <section className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h2 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              {t("settings.security")}
            </h2>
            <div className="space-y-2">
              <p className="text-[12px] text-muted-foreground">{t("settings.security_tls_title")}</p>
              <p className="text-[12px] text-muted-foreground">{t("settings.security_hmac_title")}</p>
              <p className="text-[12px] text-muted-foreground">{t("settings.security_isolation_title")}</p>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
