"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { workspace } from "@/prisma/generated/client";

export default function WorkspaceModal({ workspace }: { workspace: workspace | undefined }) {
  const router = useRouter();
  const [name, setName] = useState(workspace?.name || "");
  const [description, setDescription] = useState(workspace?.description || "");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (workspace) {
      setName(workspace?.name || "");
      setDescription(workspace?.description || "");
    }
  }, [workspace]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      if (!name) {
        logger.error("Informe o nome do workspace");
        return;
      }

      const { data } = await api.post("/workspaces", {
        name,
        description,
      });
      if (data.success) {
        // Redireciona para o workspace manager para padrao unico de rotas.
        window.location.href = "/workspaces";
      }
    } catch (error) {
      logger.error("Erro ao criar workspace", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      if (!workspace?.id || !name) {
        logger.error("Workspace id ou name nao encontrado");
        return;
      }

      const { data } = await api.patch(`/workspaces/${workspace?.id}`, {
        name,
        description,
      });

      if (data.success) {
        router.push("/workspaces");
      }
    } catch (error) {
      logger.error("Erro ao atualizar workspace", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={workspace && workspace.id ? handleUpdateWorkspace : handleCreateWorkspace}>
      <Card>
        <CardHeader>
          <CardTitle>Informações do Workspace</CardTitle>
          <CardDescription>Configure as informações bÃ¡sicas do workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Workspace</Label>
            <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Digite o nome do workspace" required disabled={isSending} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Digite uma descrição para o workspace" rows={4} disabled={isSending} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isSending}>
            {workspace && workspace.id ? "Atualizar" : "Criar"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

