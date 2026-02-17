"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import WorkspaceSelect from "@/components/workspace-select";
import { LoadingSpinner } from "@/components/loading";

type AppLayoutProps = {
  children: React.ReactNode;
  title?: string;
  backButton?: { href: string; label: string };
  rightComponent?: React.ReactNode;
  isLoading?: boolean;
  requireWorkspace?: boolean;
};

export default function AppLayout({
  children,
  title,
  backButton,
  rightComponent,
  isLoading,
  requireWorkspace = true,
}: AppLayoutProps) {
  const { user } = useAuth();

  if (requireWorkspace && user && !user.workspace_active_id) {
    return <WorkspaceSelect />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        {title || backButton || rightComponent ? (
          <header className="h-[56px] border-b border-border px-4 md:px-6 flex items-center gap-3">
            {backButton ? (
              <Link href={backButton.href} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                {backButton.label}
              </Link>
            ) : null}
            {title ? <h1 className="text-sm font-semibold">{title}</h1> : null}
            <div className="ml-auto">{rightComponent}</div>
          </header>
        ) : null}

        {isLoading ? (
          <div className="h-[calc(100vh-56px)] flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
