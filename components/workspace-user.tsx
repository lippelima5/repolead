"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Shield, Trash2, User, Users } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { canInviteRole, canManageMembers, canRemoveMember } from "@/lib/workspace-permissions";
import { formatDateTime, getInitials } from "@/lib/utils";
import { WorkspaceRelations, WorkspaceUserRelations } from "@/types";
import { role } from "@/prisma/generated/enums";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export default function WorkspaceUser({ workspace, className }: { workspace: WorkspaceRelations; className?: string }) {
  const { user } = useAuth();
  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUserRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<role>("user");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<WorkspaceUserRelations | null>(null);

  const currentWorkspaceUser = workspace.users.find((item) => item.user_id === user?.id);
  const currentUserRole = currentWorkspaceUser?.role ?? null;
  const canManage = canManageMembers(currentUserRole);

  const availableInviteRoles = useMemo(
    () => (["admin", "user", "viewer"] as role[]).filter((targetRole) => canInviteRole(currentUserRole, targetRole)),
    [currentUserRole],
  );

  const fetchWorkspaceUsers = useCallback(async () => {
    if (!workspace?.id) return;

    setIsLoading(true);
    try {
      const { data } = await api.get(`/workspaces/${workspace.id}/members`);
      if (data.success) {
        setWorkspaceUsers(data.data);
      }
    } catch (error) {
      logger.error("Erro ao carregar usuarios do workspace", error);
    } finally {
      setIsLoading(false);
    }
  }, [workspace?.id]);

  useEffect(() => {
    fetchWorkspaceUsers();
  }, [fetchWorkspaceUsers]);

  useEffect(() => {
    if (!availableInviteRoles.includes(newUserRole)) {
      setNewUserRole(availableInviteRoles[0] ?? "user");
    }
  }, [availableInviteRoles, newUserRole]);

  const handleAddUser = useCallback(async () => {
    if (!newUserEmail.trim()) {
      logger.error("Por favor, insira um email");
      return;
    }

    if (!canManage) {
      logger.error("Voce nao tem permissao para convidar usuarios");
      return;
    }

    if (!workspace?.id) return;

    setIsAddingUser(true);
    try {
      const { data } = await api.post(`/workspaces/${workspace.id}/members`, {
        email: newUserEmail,
        role: newUserRole,
      });

      if (data.success) {
        logger.success(data.message || "Convite enviado com sucesso");
        await fetchWorkspaceUsers();
        setNewUserEmail("");
      }
    } catch (error) {
      logger.error("Erro ao adicionar usuario ao workspace", error);
    } finally {
      setIsAddingUser(false);
    }
  }, [canManage, fetchWorkspaceUsers, newUserEmail, newUserRole, workspace?.id]);

  const handleOpenDeleteDialog = useCallback((target: WorkspaceUserRelations) => {
    setSelectedUser(target);
    setOpenDeleteDialog(true);
  }, []);

  const handleRemoveUser = useCallback(async () => {
    if (!selectedUser || !workspace?.id) return;

    if (!canRemoveMember(currentUserRole, selectedUser.role, selectedUser.user_id === user?.id)) {
      logger.error("Voce nao tem permissao para remover este usuario");
      return;
    }

    try {
      const { data } = await api.delete(`/workspaces/${workspace.id}/members/${selectedUser.user_id}`);
      if (data.success) {
        logger.success("Usuario removido do workspace com sucesso");
        await fetchWorkspaceUsers();
        setOpenDeleteDialog(false);
      }
    } catch (error) {
      logger.error("Erro ao remover usuario do workspace", error);
    }
  }, [currentUserRole, fetchWorkspaceUsers, selectedUser, user?.id, workspace?.id]);

  const filteredUsers = workspaceUsers.filter(
    (workspaceUser) =>
      workspaceUser.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workspaceUser.user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const roleLabel = (memberRole: role) => {
    if (memberRole === "owner") return "Owner";
    if (memberRole === "admin") return "Administrador";
    if (memberRole === "viewer") return "Visualizador";
    return "Usuario";
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[14px] text-foreground">
            <Users className="h-5 w-5 text-muted-foreground" />
            Gerenciar Usuarios do Workspace
          </CardTitle>
          <CardDescription className="text-[12px]">Adicione, remova ou altere as funcoes dos usuarios neste workspace.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="my-2 space-y-4">
            {canManage ? (
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <label htmlFor="new-user-email" className="text-[12px] font-medium text-foreground">
                    Adicionar usuario por email
                  </label>
                  <Input
                    id="new-user-email"
                    placeholder="email@exemplo.com"
                    className="h-9 text-[13px]"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>

                <div className="w-[140px] space-y-2">
                  <label htmlFor="new-user-role" className="text-[12px] font-medium text-foreground">
                    Funcao
                  </label>
                  <select
                    id="new-user-role"
                    className="h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as role)}
                  >
                    {availableInviteRoles.map((inviteRole) => (
                      <option key={inviteRole} value={inviteRole}>
                        {roleLabel(inviteRole)}
                      </option>
                    ))}
                  </select>
                </div>

                <Button onClick={handleAddUser} disabled={isAddingUser} className="mb-0.5 h-9 text-[13px]">
                  <Plus className="mr-1 h-4 w-4" />
                  {isAddingUser ? "Enviando..." : "Convidar"}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Apenas administradores ou owners podem convidar e remover usuarios.
              </p>
            )}

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar usuarios..."
                className="pl-8 h-9 text-[13px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Funcao</TableHead>
                    <TableHead className="hidden md:table-cell">Adicionado em</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex justify-center">
                          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Nenhum usuario encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((workspaceUser) => (
                      <TableRow key={workspaceUser.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={workspaceUser.user.avatar || undefined} alt={workspaceUser.user.name || "User"} />
                              <AvatarFallback>{getInitials(workspaceUser?.user?.name || "")}</AvatarFallback>
                            </Avatar>

                            <div className="flex flex-col">
                              <span className="font-medium">{workspaceUser.user.name || "Sem nome"}</span>
                              <span className="text-sm text-muted-foreground">{workspaceUser.user.email}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant={workspaceUser.role === "admin" || workspaceUser.role === "owner" ? "default" : "outline"}>
                            {workspaceUser.role === "admin" || workspaceUser.role === "owner" ? (
                              <Shield className="mr-1 h-3 w-3" />
                            ) : (
                              <User className="mr-1 h-3 w-3" />
                            )}
                            {roleLabel(workspaceUser.role)}
                          </Badge>
                        </TableCell>

                        <TableCell className="hidden md:table-cell">{formatDateTime(String(workspaceUser.created_at))}</TableCell>

                        <TableCell>
                          {canRemoveMember(currentUserRole, workspaceUser.role, workspaceUser.user_id === user?.id) ? (
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog(workspaceUser)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Usuario do Workspace</DialogTitle>
            <DialogDescription>Tem certeza que deseja remover este usuario do workspace?</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedUser && (
              <div className="flex items-center gap-3 rounded-md border p-4">
                <Avatar>
                  <AvatarImage src={selectedUser.user.avatar || undefined} alt={selectedUser.user.name || "User"} />
                  <AvatarFallback>{getInitials(selectedUser?.user?.name || "")}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                  <span className="font-medium">{selectedUser?.user?.name || "Sem nome"}</span>
                  <span className="text-sm text-muted-foreground">{selectedUser.user.email}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRemoveUser}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
