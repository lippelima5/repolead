"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown, PlusCircle, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import logger from "@/lib/logger.client"
import { useAuth } from "@/contexts/auth-context"
import { WorkspaceUserRelations } from "@/types"
import { workspace } from "@/prisma/generated/client"

interface WorkspaceSwitcherProps {
  className?: string
}

export function WorkspaceSwitcher({ className }: WorkspaceSwitcherProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [workspaces, setWorkspaces] = useState<WorkspaceUserRelations[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchWorkspaces = async () => {
      setIsLoading(true)
      try {
        const { data } = await api.get("/workspace")
        if (data.success) {
          setWorkspaces(data.data)

          // Se houver um workspace ativo, selecione-o 
          if (user?.workspace_active_id) {
            const activeWorkspace = data.data.find((w: WorkspaceUserRelations) => w.workspace_id === user.workspace_active_id)
            if (activeWorkspace) {
              setSelectedWorkspace(activeWorkspace.workspace)
            }
          }

        }
      } catch (error) {
        logger.error("Erro ao carregar workspaces", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkspaces()
  }, [user])

  const handleSelectWorkspace = async (workspace: workspace) => {
    try {
      const { data } = await api.put("/profile", {
        workspace_active_id: workspace.id,
      })

      if (data.success) {
        setSelectedWorkspace(workspace)
        // Recarregar a pÃ¡gina para aplicar o contexto do novo workspace
        window.location.reload()
      }
    } catch (error) {
      logger.error("Erro ao trocar de workspace", error)
    } finally {
      setOpen(false)
    }
  }

  const handleCreateWorkspace = () => {
    router.push("/dashboard/settings/workspace/create")
    setOpen(false)
  }

  const handleManageWorkspaces = () => {
    router.push("/dashboard/settings/workspace")
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Selecione um workspace"
          className={cn("w-[300px] justify-between", className)}
          disabled={isLoading}
        >
          {isLoading ? (
            "Carregando..."
          ) : selectedWorkspace ? (
            <>
              <Building className="mr-2 h-4 w-4" />
              {selectedWorkspace.name}
            </>
          ) : (
            "Selecione um workspace"
          )}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="Buscar workspace..." />
            <CommandEmpty>Nenhum workspace encontrado.</CommandEmpty>
            {workspaces.length > 0 && (
              <CommandGroup heading="Workspaces">
                {workspaces.map((workspace) => (
                  <CommandItem key={workspace.workspace_id} onSelect={() => handleSelectWorkspace(workspace.workspace)} className="text-sm">
                    <Building className="mr-2 h-4 w-4" />
                    {workspace.workspace.name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedWorkspace?.id === workspace.workspace_id ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
          <CommandSeparator />
          <CommandList>
            <CommandGroup>
              <CommandItem onSelect={handleCreateWorkspace}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar Workspace
              </CommandItem>
              <CommandItem onSelect={handleManageWorkspaces}>
                <Building className="mr-2 h-4 w-4" />
                Gerenciar Workspaces
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

