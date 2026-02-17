"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building, MoreHorizontal, PencilLine, Plus, Trash2 } from "lucide-react";
import AppLayout from "@/components/app-layout";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { canManageWorkspace } from "@/lib/workspace-permissions";
import { WorkspaceStatusName } from "@/lib/shared";
import { formatDate } from "@/lib/utils";
import { WorkspaceUserRelations } from "@/types";

export default function WorkspacesPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceUserRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceUserRelations | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/workspace");
      if (data.success) {
        setWorkspaces(data.data);
      }
    } catch (error) {
      logger.error("Erro ao carregar workspaces", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!selectedWorkspace) return;

    try {
      const { data } = await api.delete(`/workspace/${selectedWorkspace.workspace?.id}`);
      if (data.success) {
        logger.success("Workspace excluido com sucesso");
        window.location.reload();
      }
    } catch (error) {
      logger.error("Erro ao excluir workspace", error);
    }
  };

  const handleCreateWorkspace = () => {
    router.push("/dashboard/settings/workspace/create");
  };

  const handleEditWorkspace = (workspace: WorkspaceUserRelations) => {
    router.push(`/dashboard/settings/workspace/${workspace.workspace?.id}/edit`);
  };

  const handleViewWorkspace = (workspace: WorkspaceUserRelations) => {
    router.push(`/dashboard/settings/workspace/${workspace.workspace?.id}`);
  };

  const handleOpenDeleteDialog = (workspace: WorkspaceUserRelations) => {
    setSelectedWorkspace(workspace);
    setOpenDeleteDialog(true);
  };

  const filteredWorkspaces = workspaces.filter(
    (workspace) =>
      workspace?.workspace?.name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
      (workspace?.workspace?.description &&
        workspace?.workspace?.description?.toLowerCase().includes(searchQuery?.toLowerCase())),
  );

  return (
    <AppLayout
      title="Workspaces"
      isLoading={isLoading}
      rightComponent={
        <Button onClick={handleCreateWorkspace}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Workspace
        </Button>
      }
    >
      <div className="flex flex-col gap-6 p-4">
        <div className="flex items-center">
          <div className="relative w-full max-w-sm">
            <Input
              type="search"
              placeholder="Buscar workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-10"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredWorkspaces.map((workspace) => {
            const canManageCurrentWorkspace = canManageWorkspace(workspace.role);

            return (
              <Card key={workspace.workspace?.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        {workspace.workspace?.name}
                      </CardTitle>
                      <CardDescription>{workspace.workspace?.description || "Sem descricao"}</CardDescription>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewWorkspace(workspace)}>
                          <Building className="mr-2 h-4 w-4" />
                          Detalhes
                        </DropdownMenuItem>

                        {canManageCurrentWorkspace ? (
                          <>
                            <DropdownMenuItem onClick={() => handleEditWorkspace(workspace)}>
                              <PencilLine className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleOpenDeleteDialog(workspace)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <div className="text-xs text-muted-foreground">
                          Criado em {formatDate(String(workspace.workspace?.created_at))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{WorkspaceStatusName(workspace.workspace?.plan_status || "") || "-"}</Badge>
                        <Badge variant={workspace.role === "owner" || workspace.role === "admin" ? "default" : "secondary"}>
                          {workspace.role === "owner" ? "Owner" : workspace.role === "admin" ? "Admin" : workspace.role === "viewer" ? "Viewer" : "User"}
                        </Badge>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full" onClick={() => handleViewWorkspace(workspace)}>
                      Acessar Workspace
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredWorkspaces.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center rounded-lg border p-12 text-center">
              <Building className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Nenhum workspace encontrado</h3>
              <p className="mb-4 mt-1 text-muted-foreground">
                {searchQuery ? "Nenhum workspace corresponde a sua busca." : "Crie seu primeiro workspace para comecar."}
              </p>
              <Button onClick={handleCreateWorkspace}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Workspace
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        title="Excluir Workspace"
        description="Tem certeza que deseja excluir este workspace? Esta acao nao pode ser desfeita."
        isOpen={openDeleteDialog}
        onConfirm={handleDeleteWorkspace}
        onCancel={() => setOpenDeleteDialog(false)}
      />
    </AppLayout>
  );
}