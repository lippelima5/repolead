"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Mail, RefreshCw, Search, ShieldAlert, ShieldCheck, Settings2 } from "lucide-react";
import AppLayout from "@/components/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { formatDateTime } from "@/lib/utils";

type AdminUserListItem = {
  id: number;
  name: string | null;
  email: string;
  role: "owner" | "admin" | "user" | "viewer";
  verified_at: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  memberships_count: number;
  pending_invites_count: number;
};

type Membership = {
  workspace_id: number;
  role: "owner" | "admin" | "user" | "viewer";
  created_at: string;
  workspace: {
    id: number;
    name: string;
    description: string | null;
    plan_status: string;
    created_at: string;
  };
};

type PendingInvite = {
  id: number;
  role: "owner" | "admin" | "user" | "viewer";
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  workspace: {
    id: number;
    name: string;
  };
  invited_by: {
    id: number;
    name: string | null;
    email: string;
  };
};

type AdminUserDetails = AdminUserListItem & {
  workspaces: Membership[];
  pending_invites: PendingInvite[];
};

function roleLabel(value: AdminUserListItem["role"] | Membership["role"] | PendingInvite["role"]) {
  if (value === "admin") return "Admin";
  if (value === "owner") return "Owner";
  if (value === "viewer") return "Viewer";
  return "User";
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [runningActionKey, setRunningActionKey] = useState<string | null>(null);

  const fetchUsers = useCallback(async (searchText?: string) => {
    setIsLoadingUsers(true);

    try {
      const query = searchText?.trim() ? `?search=${encodeURIComponent(searchText.trim())}` : "";
      const { data } = await api.get(`/admin/user${query}`);

      if (data?.success) {
        setUsers(data.data || []);
      }
    } catch (error) {
      logger.error("Erro ao carregar usuarios", error);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const fetchUserDetails = useCallback(async (userId: number) => {
    setIsLoadingDetails(true);

    try {
      const { data } = await api.get(`/admin/user/${userId}`);

      if (data?.success) {
        setSelectedUser(data.data);
      }
    } catch (error) {
      logger.error("Erro ao carregar detalhes do usuario", error);
      setSelectedUser(null);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers("");
  }, [fetchUsers]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers(search);
    }, 350);

    return () => clearTimeout(timeout);
  }, [fetchUsers, search]);

  useEffect(() => {
    if (!selectedUserId) return;
    fetchUserDetails(selectedUserId);
  }, [fetchUserDetails, selectedUserId]);

  const activeSelectedUser = useMemo(
    () => users.find((item) => item.id === selectedUserId) || selectedUser,
    [selectedUser, selectedUserId, users],
  );

  const runUserAction = useCallback(
    async (actionKey: string, runner: () => Promise<void>) => {
      try {
        setRunningActionKey(actionKey);
        await runner();
      } finally {
        setRunningActionKey(null);
      }
    },
    [],
  );

  const handleToggleSuspension = async (user: AdminUserListItem) => {
    await runUserAction(`toggle-suspension-${user.id}`, async () => {
      const isSuspended = Boolean(user.suspended_at);

      const reason = isSuspended
        ? null
        : window.prompt("Informe o motivo da suspensao (opcional):")?.trim() || null;

      const { data } = await api.patch(`/admin/user/${user.id}`, {
        action: isSuspended ? "reactivate" : "suspend",
        reason,
      });

      if (data?.success) {
        logger.success(data.message || "Status atualizado.");
        await fetchUsers(search);

        if (selectedUserId === user.id) {
          await fetchUserDetails(user.id);
        }
      }
    }).catch((error) => {
      logger.error("Erro ao atualizar status do usuario", error);
    });
  };

  const handleSendMagicLink = async (user: AdminUserListItem) => {
    await runUserAction(`magic-link-${user.id}`, async () => {
      const { data } = await api.post(`/admin/user/${user.id}/magic-link`);

      if (data?.success) {
        logger.success(data.message || "Magic link reenviado.");
      }
    }).catch((error) => {
      logger.error("Erro ao reenviar magic link", error);
    });
  };

  const handleResendInvites = async (user: AdminUserListItem) => {
    await runUserAction(`invite-resend-${user.id}`, async () => {
      const { data } = await api.post(`/admin/user/${user.id}/invite/resend`);

      if (data?.success) {
        logger.success(data.message || "Convites reenviados.");

        if (selectedUserId === user.id) {
          await fetchUserDetails(user.id);
        }

        await fetchUsers(search);
      }
    }).catch((error) => {
      logger.error("Erro ao reenviar convites", error);
    });
  };

  return (
    <AppLayout
      title="Admin - Usuarios"
      requireWorkspace={false}
      rightComponent={
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/billing">
              <Settings2 className="mr-2 h-4 w-4" />
              Billing plans
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              fetchUsers(search);
              if (selectedUserId) {
                fetchUserDetails(selectedUserId);
              }
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      }
    >
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestao global de usuarios</CardTitle>
            <CardDescription>Liste, suspenda, reative e execute acoes de acesso e convite.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou e-mail"
                className="pl-8"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Global role</TableHead>
                  <TableHead>Membros</TableHead>
                  <TableHead>Invites pendentes</TableHead>
                  <TableHead className="w-[420px]">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingUsers ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-20 text-center">
                      <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando usuarios...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                      Nenhum usuario encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((item) => {
                    const isSuspended = Boolean(item.suspended_at);
                    const isSelected = selectedUserId === item.id;

                    return (
                      <TableRow key={item.id} data-state={isSelected ? "selected" : undefined}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{item.name || "Sem nome"}</span>
                            <span className="text-sm text-muted-foreground">{item.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isSuspended ? (
                            <Badge variant="destructive">Suspenso</Badge>
                          ) : (
                            <Badge variant="outline">Ativo</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.role === "admin" ? "default" : "secondary"}>{roleLabel(item.role)}</Badge>
                        </TableCell>
                        <TableCell>{item.memberships_count}</TableCell>
                        <TableCell>{item.pending_invites_count}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => setSelectedUserId(item.id)}>
                              Ver memberships
                            </Button>
                            <Button
                              variant={isSuspended ? "default" : "destructive"}
                              size="sm"
                              disabled={runningActionKey === `toggle-suspension-${item.id}`}
                              onClick={() => handleToggleSuspension(item)}
                            >
                              {runningActionKey === `toggle-suspension-${item.id}` ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : isSuspended ? (
                                <ShieldCheck className="mr-2 h-4 w-4" />
                              ) : (
                                <ShieldAlert className="mr-2 h-4 w-4" />
                              )}
                              {isSuspended ? "Reativar" : "Suspender"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSuspended || runningActionKey === `magic-link-${item.id}`}
                              onClick={() => handleSendMagicLink(item)}
                            >
                              {runningActionKey === `magic-link-${item.id}` ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Mail className="mr-2 h-4 w-4" />
                              )}
                              Reenviar magic link
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={runningActionKey === `invite-resend-${item.id}`}
                              onClick={() => handleResendInvites(item)}
                            >
                              {runningActionKey === `invite-resend-${item.id}` ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                              )}
                              Reenviar convites
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selectedUserId ? (
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do usuario</CardTitle>
              <CardDescription>
                {activeSelectedUser ? `${activeSelectedUser.name || "Sem nome"} - ${activeSelectedUser.email}` : "Carregando..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingDetails ? (
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando detalhes...
                </div>
              ) : selectedUser ? (
                <>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <Badge variant={selectedUser.suspended_at ? "destructive" : "outline"}>
                      {selectedUser.suspended_at ? "Suspenso" : "Ativo"}
                    </Badge>
                    <Badge variant={selectedUser.role === "admin" ? "default" : "secondary"}>
                      {roleLabel(selectedUser.role)}
                    </Badge>
                    <span className="text-muted-foreground">Criado em {formatDateTime(selectedUser.created_at)}</span>
                  </div>

                  {selectedUser.suspended_reason ? (
                    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                      Motivo da suspensao: {selectedUser.suspended_reason}
                    </div>
                  ) : null}

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Memberships ({selectedUser.workspaces.length})</h3>
                    {selectedUser.workspaces.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma membership encontrada.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedUser.workspaces.map((membership) => (
                          <div key={`${membership.workspace_id}-${membership.role}`} className="rounded-md border p-3 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{membership.workspace.name}</span>
                              <Badge variant="outline">{roleLabel(membership.role)}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Entrou em {formatDateTime(membership.created_at)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Convites pendentes ({selectedUser.pending_invites.length})</h3>
                    {selectedUser.pending_invites.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum convite pendente.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedUser.pending_invites.map((invite) => (
                          <div key={invite.id} className="rounded-md border p-3 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{invite.workspace.name}</span>
                              <Badge variant="outline">{roleLabel(invite.role)}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Expira em {formatDateTime(invite.expires_at)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Nao foi possivel carregar os detalhes.</p>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppLayout>
  );
}
