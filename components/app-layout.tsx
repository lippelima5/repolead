'use client'

import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "./ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { LoadingSpinner } from "./loading"
import WorkspaceSelect from "./workspace-select"
import { WorkspaceSwitcher } from "./workspace-switcher"

export default function AppLayout({
    children,
    title,
    backButton,
    rightComponent,
    isLoading,
    requireWorkspace = true,
}: {
    children: React.ReactNode,
    title: string,
    backButton?: { href: string, label: string },
    rightComponent?: React.ReactNode,
    isLoading?: boolean,
    requireWorkspace?: boolean,
}) {
    const { user } = useAuth()

    if (requireWorkspace && user && !user.workspace_active_id) {
        return <WorkspaceSelect />
    }

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="min-w-0 overflow-hidden">
                <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
                    <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6 p-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
                        {backButton && (
                            <Button asChild variant="ghost" size="sm" >
                                <Link href={backButton.href}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    {backButton.label}
                                </Link>
                            </Button>
                        )}
                        <h1 className="text-base font-medium hidden md:block">{title}</h1>
                        <div className="ml-auto flex items-center gap-2">
                            <div className="hidden md:block">
                                {requireWorkspace ? <WorkspaceSwitcher /> : null}
                            </div>
                            {rightComponent}
                        </div>
                    </div>
                </header>
                {isLoading ? <div className="flex h-full items-center justify-center"><LoadingSpinner /></div> : children}

            </SidebarInset>
        </SidebarProvider>
    )
}
