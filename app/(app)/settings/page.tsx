"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Globe, Shield, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/app-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/contexts/auth-context";
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
  const { user } = useAuth();
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
        toast.success("Workspace updated");
      }
    } catch (error) {
      logger.error("Failed to update workspace", error);
      toast.error("Failed to update workspace");
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
        toast.success("Member added");
        setInviteEmail("");
        await loadWorkspace();
      }
    } catch (error) {
      logger.error("Failed to invite member", error);
      toast.error("User not found or permission denied");
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-[1200px] space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Workspace, members, security and alerts</p>
        </div>

        <Tabs defaultValue="workspace" className="space-y-4">
          <TabsList className="bg-surface-2 border border-border rounded-lg p-1 h-auto">
            <TabsTrigger value="workspace" className="text-[12px] rounded-md px-3 py-1.5">
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              Workspace
            </TabsTrigger>
            <TabsTrigger value="members" className="text-[12px] rounded-md px-3 py-1.5">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Members
            </TabsTrigger>
            <TabsTrigger value="security" className="text-[12px] rounded-md px-3 py-1.5">
              <Shield className="w-3.5 h-3.5 mr-1.5" />
              Security
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-[12px] rounded-md px-3 py-1.5">
              <Bell className="w-3.5 h-3.5 mr-1.5" />
              Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workspace">
            <div className="bg-card border border-border rounded-xl p-5 space-y-4 max-w-lg">
              <h3 className="text-[13px] font-medium text-foreground">Workspace configuration</h3>
              <div>
                <label className="text-[13px] font-medium text-foreground">Name</label>
                <Input
                  value={workspace?.name || ""}
                  className="mt-1.5 h-9 text-[13px]"
                  onChange={(event) => setWorkspace((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                />
              </div>
              <div>
                <label className="text-[13px] font-medium text-foreground">Slug</label>
                <Input
                  value={workspace?.slug || ""}
                  className="mt-1.5 h-9 text-[13px]"
                  onChange={(event) => setWorkspace((prev) => (prev ? { ...prev, slug: event.target.value || null } : prev))}
                />
              </div>
              <div>
                <label className="text-[13px] font-medium text-foreground">Data retention (days)</label>
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
                <label className="text-[13px] font-medium text-foreground">Idempotency window (hours)</label>
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
                Save
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="members">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-end gap-2 p-4 bg-surface-2 rounded-xl border border-border">
                <div className="flex-1">
                  <label className="text-[12px] font-medium text-foreground">Member email</label>
                  <Input
                    value={inviteEmail}
                    placeholder="email@example.com"
                    className="mt-1 h-8 text-[12px]"
                    onChange={(event) => setInviteEmail(event.target.value)}
                  />
                </div>
                <div className="w-32">
                  <label className="text-[12px] font-medium text-foreground">Role</label>
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
                  Add
                </Button>
              </div>

              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface-2">
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.user_id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors duration-100">
                        <td className="px-4 py-3 text-[13px] font-medium text-foreground">{member.user.name || "Unnamed"}</td>
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
          </TabsContent>

          <TabsContent value="security">
            <div className="bg-card border border-border rounded-xl p-5 space-y-3 max-w-lg">
              {[
                { title: "TLS 1.2+ required", description: "All outgoing webhooks use HTTPS transport." },
                { title: "HMAC-SHA256 signatures", description: "Delivery signature includes timestamp and payload digest." },
                { title: "Workspace isolation", description: "Every read/write is scoped by workspace_id." },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between p-3 bg-surface-2 rounded-xl">
                  <div>
                    <p className="text-[13px] text-foreground">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">{item.description}</p>
                  </div>
                  <StatusBadge status="active" label="active" />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="alerts">
            <div className="bg-card border border-border rounded-xl p-5 space-y-4 max-w-lg">
              <p className="text-[13px] text-muted-foreground">
                Configure alert rules in this workspace. Use the Alerts page to view triggered events.
              </p>
              <Button asChild size="sm" className="h-8 text-[13px]">
                <a href="/alerts">Open alerts center</a>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
