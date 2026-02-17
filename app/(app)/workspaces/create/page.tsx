"use client";

import AppLayout from "@/components/app-layout";
import WorkspaceModal from "@/components/workspace-modal";

export default function CreateWorkspacePage() {
  return (
    <AppLayout
      title="Criar Workspace"
      backButton={{
        href: "/workspaces",
        label: "Voltar para workspaces",
      }}>
      <div className="p-4 md:p-6 max-w-[1000px] space-y-5">
        <WorkspaceModal workspace={undefined} />
      </div>
    </AppLayout>
  );
}

