"use client";

import AppLayout from "@/components/app-layout";
import WorkspaceModal from "@/components/workspace-modal";

export default function CreateWorkspacePage() {
  return (
    <AppLayout
      title="Criar Workspace"
      backButton={{
        href: "/dashboard/settings/workspace",
        label: "Voltar para workspaces",
      }}>
      <div className="flex flex-col gap-6 p-4">
        <WorkspaceModal workspace={undefined} />
      </div>
    </AppLayout>
  );
}

