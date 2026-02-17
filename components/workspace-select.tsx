"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Building, Plus, ArrowRight, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import api from "@/lib/api"
import logger from "@/lib/logger.client"
import { WorkspaceUserRelations } from "@/types"
import { workspace } from "@/prisma/generated/client"

export default function WorkspaceSelect() {
    const [workspaces, setWorkspaces] = useState<WorkspaceUserRelations[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [newWorkspace, setNewWorkspace] = useState({
        name: "",
        description: "",
    })

    useEffect(() => {
        fetchWorkspaces()
    }, [])

    const fetchWorkspaces = async () => {
        setIsLoading(true)
        try {
            const { data } = await api.get("/workspaces")
            if (data.success) {
                setWorkspaces(data.data || [])
                // If no workspaces, show create form automatically
                if (!data.data || data.data.length === 0) {
                    setShowCreateForm(true)
                }
            }
        } catch (error) {
            logger.error("Erro ao carregar workspaces", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSelectWorkspace = async (workspace: workspace) => {
        try {
            const { data } = await api.put("/profile", {
                workspace_active_id: workspace.id,
            })

            if (data.success) {
                logger.success("Workspace selecionado com sucesso")
                window.localStorage.setItem("leadvault.workspace_id", String(workspace.id))

                // Reload the page to apply the new workspace context
                window.location.reload()
            }
        } catch (error) {
            logger.error("Erro ao selecionar workspace", error)
        }
    }

    const handleCreateWorkspace = async () => {
        if (!newWorkspace.name.trim()) {
            logger.error("Por favor, insira um nome para o workspace")
            return
        }

        setIsCreating(true)
        try {
            const { data } = await api.post("/workspaces", newWorkspace)
            if (data.success) {
                logger.success("Workspace criado com sucesso")

                // Select the newly created workspace
                await handleSelectWorkspace(data.data)
            }
        } catch (error) {
            logger.error("Erro ao criar workspace", error)
        } finally {
            setIsCreating(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setNewWorkspace((prev) => ({ ...prev, [name]: value }))
    }

    return (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl flex items-center justify-center gap-2">
                        <Building className="h-6 w-6 text-primary" />
                        {showCreateForm ? "Criar seu primeiro workspace" : "Selecione um workspace"}
                    </CardTitle>
                    <CardDescription>
                        {showCreateForm
                            ? "Crie um workspace para começar a usar a plataforma"
                            : "Selecione um workspace para continuar"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : showCreateForm ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do Workspace</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={newWorkspace.name}
                                    onChange={handleInputChange}
                                    placeholder="Digite o nome do workspace"
                                    disabled={isCreating}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição (opcional)</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={newWorkspace.description}
                                    onChange={handleInputChange}
                                    placeholder="Digite uma descrição para o workspace"
                                    rows={3}
                                    disabled={isCreating}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {workspaces.length > 0 ? (
                                <div className="space-y-2">
                                    {workspaces.map((workspace) => (
                                        <div
                                            key={workspace.workspace_id}
                                            className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer"
                                            onClick={() => handleSelectWorkspace(workspace.workspace)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Building className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">{workspace?.workspace?.name}</p>
                                                    {workspace?.workspace?.description && (
                                                        // corta a descricao para 30 caracteres
                                                        <p className="text-sm text-muted-foreground">{workspace?.workspace?.description ? `${workspace?.workspace?.description.substring(0, 50).trim()}...` : ""}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium">Nenhum workspace encontrado</h3>
                                    <p className="text-muted-foreground mt-1 mb-4">Crie seu primeiro workspace para começar.</p>
                                </div>
                            )}

                            <Separator />

                            <div className="text-center">
                                <Button variant="outline" onClick={() => setShowCreateForm(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Criar novo workspace
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
                {showCreateForm && (
                    <CardFooter className="flex justify-end gap-2">
                        {workspaces.length > 0 && (
                            <Button variant="outline" onClick={() => setShowCreateForm(false)} disabled={isCreating}>
                                Voltar
                            </Button>
                        )}
                        <Button onClick={handleCreateWorkspace} disabled={isCreating}>
                            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isCreating ? "Criando..." : "Criar workspace"}
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    )
}
