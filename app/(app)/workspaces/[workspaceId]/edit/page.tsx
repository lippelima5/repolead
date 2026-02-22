"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import AppLayout from "@/components/app-layout";
import WorkspaceForm from "@/components/workspace-modal";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { canManageWorkspace } from "@/lib/workspace-permissions";
import { WorkspaceRelations } from "@/types";

export default function EditWorkspacePage() {
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

    fetchWorkspace();
  }, [workspaceId, router]);

  const currentWorkspaceRole = useMemo(() => {
    if (!workspace || !user) return null;
    const membership = workspace.users.find((item) => item.user_id === user.id);
    return membership?.role ?? null;
  }, [workspace, user]);

  const canManage = canManageWorkspace(currentWorkspaceRole);

  return (
    <AppLayout
      title={workspace ? `Editar: ${workspace.name}` : "Editar Workspace"}
      backButton={{
        href: "/workspaces",
        label: "Voltar para workspaces",
      }}
      isLoading={isLoading}
    >
      <div className="p-4 md:p-6 max-w-[1000px] space-y-5">
        {workspace && canManage ? <WorkspaceForm workspace={workspace} /> : null}
        {workspace && !canManage ? (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Você não tem permissao para editar este workspace.
            <div className="mt-3">
              <Button variant="outline" className="h-8 text-[12px]" onClick={() => router.push(`/workspaces/${workspaceId}`)}>
                Voltar para detalhes
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
