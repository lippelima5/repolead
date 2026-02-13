"use client"

import { Building, } from "lucide-react"
import AppLayout from "@/components/app-layout"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export default function Page() {
    const menus = [
        {
            title: "Workspaces",
            description: "Gerenciamento de workspaces, membros e permissões",
            icon: Building,
            color: "text-green-600",
            path: "/dashboard/settings/workspace",
        },
    ]

    return (
        <AppLayout title="Selecione um menu para gerenciar">
            <div className="flex flex-col gap-6 p-4">
                <ul className="space-y-2">
                    {menus.map((menu, index) => (
                        <Link key={index} href={menu.path}>
                            <li>
                                <div className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-full bg-muted ${menu.color} bg-opacity-10`}>
                                            <menu.icon className={`h-5 w-5 ${menu.color}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium">{menu.title}</h3>
                                            <p className="text-sm text-muted-foreground">{menu.description}</p>
                                        </div>
                                    </div>
                                </div>
                                {index < menus.length - 1 && <Separator className="my-2" />}
                            </li>
                        </Link>
                    ))}
                </ul>
            </div>
        </AppLayout>
    )
}

