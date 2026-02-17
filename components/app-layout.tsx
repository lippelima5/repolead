"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Menu } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
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
  const { t } = useI18n();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const hasHeaderContent = Boolean(title || backButton || rightComponent);

  if (requireWorkspace && user && !user.workspace_active_id) {
    return <WorkspaceSelect />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <div className="hidden md:flex">
        <AppSidebar />
      </div>

      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            aria-label={t("sidebar.close_sidebar")}
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative">
            <AppSidebar mobile onClose={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      ) : null}

      <main className="min-w-0 flex-1 overflow-x-hidden">
        <header className="h-[56px] border-b border-border px-4 md:hidden flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={t("sidebar.open_sidebar")}
          >
            <Menu className="h-4 w-4" />
          </button>
          {title ? <h1 className="text-sm font-semibold truncate">{title}</h1> : <span className="text-sm font-semibold">RepoLead</span>}
          <div className="ml-auto">{rightComponent}</div>
        </header>

        {hasHeaderContent ? (
          <header className="hidden md:flex h-[56px] border-b border-border px-4 md:px-6 items-center gap-3">
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
          <div className="h-[calc(100dvh-56px)] flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
