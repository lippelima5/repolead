"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building, Calendar, Clock, PencilLine } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import AppLayout from "@/components/app-layout";
import WorkspaceUser from "@/components/workspace-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { canManageWorkspace } from "@/lib/workspace-permissions";
import { hasWorkspacePaidPlan } from "@/lib/workspace-plan";
import { WorkspaceStatusName } from "@/lib/shared";
import { formatDate, formatDateTime } from "@/lib/utils";
import { WorkspaceRelations } from "@/types";

export default function WorkspaceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace] = useState<WorkspaceRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspace = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/workspaces/${workspaceId}`);
        if (data.success) {
          setWorkspace(data.data);
        }
      } catch (error) {
        logger.error("Erro ao carregar workspace", error);
        router.push("/workspaces");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchWorkspace();
  }, [workspaceId, router]);

  const currentWorkspaceRole = useMemo(() => {
    if (!workspace || !user) return null;
    const membership = workspace.users.find((item) => item.user_id === user.id);
    return membership?.role ?? null;
  }, [workspace, user]);

  const canManage = canManageWorkspace(currentWorkspaceRole);
  const hasPaidPlan = hasWorkspacePaidPlan(workspace);

  const handleEditWorkspace = () => {
    if (!canManage) return;
    router.push(`/workspaces/${workspaceId}/edit`);
  };

  const openPortal = async () => {
    if (!canManage) {
      logger.error("Voce nao tem permissao para gerenciar billing deste workspace");
      return;
    }

    try {
      if (!workspaceId) throw new Error("workspaceId is required");

      const { data } = await api.post("/stripe/portal", { workspace_id: Number(workspaceId) });
      const redirectUrl = data?.data?.url;
      if (redirectUrl) window.location.href = redirectUrl;
    } catch (error) {
      logger.error("Erro ao abrir portal de cobranca", error);
    }
  };

  return (
    <AppLayout
      title={workspace?.name || "Detalhes do Workspace"}
      backButton={{
        href: "/workspaces",
        label: "Voltar para workspaces",
      }}
      isLoading={isLoading}
      rightComponent={
        canManage ? (
          <div className="flex gap-2">
            <Button onClick={handleEditWorkspace}>
              <PencilLine className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        ) : null
      }
    >
      {workspace && (
        <div className="flex flex-col gap-6 p-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  Informacoes
                </CardTitle>
                <CardDescription>Detalhes do workspace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">NOME</h3>
                  <p>{workspace.name}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">DESCRICAO</h3>
                  <p>{workspace.description || "Sem descricao"}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    STATUS DO PLANO <Badge className="ml-2">{WorkspaceStatusName(workspace.plan_status)}</Badge>
                  </h3>

                  <div className="mt-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-xs text-muted-foreground">Renova em</span>
                      <p className="text-sm">{workspace.plan_expires_at ? formatDate(String(workspace.plan_expires_at)) : "-"}</p>
                    </div>
                  </div>

                  {canManage ? (
                    <div className="mt-2 flex items-center gap-2">
                      {hasPaidPlan ? (
                        <Button onClick={openPortal} className="w-full">
                          Gerenciar assinatura
                        </Button>
                      ) : (
                        <Button onClick={() => router.push(`/workspaces/${workspace.id}/billing`)} className="w-full">
                          Assinar plano
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Apenas administradores ou owners podem alterar configuracoes de billing.
                    </p>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">DATAS</h3>
                  <div className="mt-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-xs text-muted-foreground">Criado em</span>
                        <p className="text-sm">{formatDateTime(String(workspace.created_at))}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-xs text-muted-foreground">Atualizado em</span>
                        <p className="text-sm">{formatDateTime(String(workspace.updated_at))}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <WorkspaceUser className="md:col-span-2" workspace={workspace} />
          </div>
        </div>
      )}
    </AppLayout>
  );
}
