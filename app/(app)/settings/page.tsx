"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Globe, Shield, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/app-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import api from "@/lib/api";
import logger from "@/lib/logger.client";

type WorkspaceData = {
  id: number;
  name: string;
  slug: string | null;
  retention_days: number;
  idempotency_window_hours: number;
};

type MemberData = {
  workspace_id: number;
  user_id: number;
  role: "owner" | "admin" | "user" | "viewer";
  created_at: string;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
};

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const workspaceId = user?.workspace_active_id ?? null;
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "user" | "viewer">("user");

  const loadWorkspace = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const [workspaceResponse, membersResponse] = await Promise.all([
        api.get(`/workspaces/${workspaceId}`),
        api.get(`/workspaces/${workspaceId}/members`),
      ]);

      if (workspaceResponse.data?.success) {
        setWorkspace(workspaceResponse.data.data);
      }

      if (membersResponse.data?.success) {
        setMembers(membersResponse.data.data);
      }
    } catch (error) {
      logger.error("Failed to load settings data", error);
    }
  }, [workspaceId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadWorkspace();
    }, 0);
    return () => clearTimeout(timeout);
  }, [loadWorkspace]);

  const saveWorkspace = async () => {
    if (!workspaceId || !workspace) {
      return;
    }

    try {
      const response = await api.patch(`/workspaces/${workspaceId}`, {
        name: workspace.name,
        slug: workspace.slug,
        retention_days: workspace.retention_days,
        idempotency_window_hours: workspace.idempotency_window_hours,
      });
      if (response.data?.success) {
        toast.success(t("settings.workspace_updated"));
      }
    } catch (error) {
      logger.error("Failed to update workspace", error);
      toast.error(t("settings.workspace_update_failed"));
    }
  };

  const inviteMember = async () => {
    if (!workspaceId || !inviteEmail.trim()) {
      return;
    }

    try {
      const response = await api.post(`/workspaces/${workspaceId}/members`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      if (response.data?.success) {
        toast.success(t("settings.member_added"));
        setInviteEmail("");
        await loadWorkspace();
      }
    } catch (error) {
      logger.error("Failed to invite member", error);
      toast.error(t("settings.member_add_failed"));
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-[1200px] space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("settings.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("settings.subtitle")}</p>
        </div>

        <Tabs defaultValue="workspace" className="space-y-4">
          <TabsList className="bg-surface-2 border border-border rounded-lg p-1 h-auto">
            <TabsTrigger value="workspace" className="text-[12px] rounded-md px-3 py-1.5">
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              {t("settings.workspace")}
            </TabsTrigger>
            <TabsTrigger value="members" className="text-[12px] rounded-md px-3 py-1.5">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              {t("settings.members")}
            </TabsTrigger>
            <TabsTrigger value="security" className="text-[12px] rounded-md px-3 py-1.5">
              <Shield className="w-3.5 h-3.5 mr-1.5" />
              {t("settings.security")}
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-[12px] rounded-md px-3 py-1.5">
              <Bell className="w-3.5 h-3.5 mr-1.5" />
              {t("settings.alerts")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workspace">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-4 max-w-5xl">
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="text-[13px] font-medium text-foreground">{t("settings.workspace_configuration")}</h3>
                <div>
                  <label className="text-[13px] font-medium text-foreground">{t("common.name")}</label>
                  <Input
                    value={workspace?.name || ""}
                    className="mt-1.5 h-9 text-[13px]"
                    onChange={(event) => setWorkspace((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-foreground">{t("settings.slug")}</label>
                  <Input
                    value={workspace?.slug || ""}
                    className="mt-1.5 h-9 text-[13px]"
                    onChange={(event) => setWorkspace((prev) => (prev ? { ...prev, slug: event.target.value || null } : prev))}
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-foreground">{t("settings.retention_days")}</label>
                  <Input
                    type="number"
                    min={1}
                    max={3650}
                    value={workspace?.retention_days || 180}
                    className="mt-1.5 h-9 text-[13px]"
                    onChange={(event) =>
                      setWorkspace((prev) =>
                        prev
                          ? {
                              ...prev,
                              retention_days: Number(event.target.value || 180),
                            }
                          : prev,
                      )
                    }
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-foreground">{t("settings.idempotency_window")}</label>
                  <Input
                    type="number"
                    min={1}
                    max={720}
                    value={workspace?.idempotency_window_hours || 24}
                    className="mt-1.5 h-9 text-[13px]"
                    onChange={(event) =>
                      setWorkspace((prev) =>
                        prev
                          ? {
                              ...prev,
                              idempotency_window_hours: Number(event.target.value || 24),
                            }
                          : prev,
                      )
                    }
                  />
                </div>
                <Button size="sm" className="h-8 text-[13px]" onClick={saveWorkspace}>
                  {t("common.save")}
                </Button>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 space-y-3 h-fit">
                <h3 className="text-[13px] font-medium text-foreground">{t("settings.workspace_actions")}</h3>
                <p className="text-[12px] text-muted-foreground">{t("settings.workspace_actions_description")}</p>
                <Button size="sm" className="h-8 text-[13px] w-full" onClick={() => router.push("/dashboard/settings/workspace/create")}>
                  {t("settings.create_workspace")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[13px] w-full"
                  onClick={() => router.push("/dashboard/settings/workspace")}
                >
                  {t("settings.open_workspace_manager")}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="members">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-end gap-2 p-4 bg-surface-2 rounded-xl border border-border">
                <div className="flex-1">
                  <label className="text-[12px] font-medium text-foreground">{t("settings.member_email")}</label>
                  <Input
                    value={inviteEmail}
                    placeholder="email@example.com"
                    className="mt-1 h-8 text-[12px]"
                    onChange={(event) => setInviteEmail(event.target.value)}
                  />
                </div>
                <div className="w-32">
                  <label className="text-[12px] font-medium text-foreground">{t("common.role")}</label>
                  <select
                    className="mt-1 h-8 w-full text-[12px] rounded-md border border-border bg-background px-2 text-foreground"
                    value={inviteRole}
                    onChange={(event) => setInviteRole(event.target.value as "admin" | "user" | "viewer")}
                  >
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <Button size="sm" className="h-8 text-[12px] gap-1.5" onClick={inviteMember}>
                  <UserPlus className="w-3 h-3" />
                  {t("settings.add_member")}
                </Button>
              </div>

              <div className="border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-surface-2">
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("common.name")}</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("common.email")}</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("common.role")}</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("common.joined")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member.user_id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors duration-100">
                          <td className="px-4 py-3 text-[13px] font-medium text-foreground">{member.user.name || t("leads.unnamed")}</td>
                          <td className="px-4 py-3 text-[12px] text-muted-foreground font-mono">{member.user.email}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={member.role} />
                          </td>
                          <td className="px-4 py-3 text-[12px] text-muted-foreground">{new Date(member.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="bg-card border border-border rounded-xl p-5 space-y-3 max-w-lg">
              {[
                { title: t("settings.security_tls_title"), description: t("settings.security_tls_desc") },
                { title: t("settings.security_hmac_title"), description: t("settings.security_hmac_desc") },
                { title: t("settings.security_isolation_title"), description: t("settings.security_isolation_desc") },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between p-3 bg-surface-2 rounded-xl">
                  <div>
                    <p className="text-[13px] text-foreground">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">{item.description}</p>
                  </div>
                  <StatusBadge status="active" label={t("common.active")} />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="alerts">
            <div className="bg-card border border-border rounded-xl p-5 space-y-4 max-w-lg">
              <p className="text-[13px] text-muted-foreground">{t("settings.alerts_description")}</p>
              <Button asChild size="sm" className="h-8 text-[13px]">
                <a href="/alerts">{t("settings.open_alerts_center")}</a>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
