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
  const [slug, setSlug] = useState(workspace?.slug || "");
  const [description, setDescription] = useState(workspace?.description || "");
  const [retentionDays, setRetentionDays] = useState<number>(workspace?.retention_days || 180);
  const [idempotencyWindowHours, setIdempotencyWindowHours] = useState<number>(workspace?.idempotency_window_hours || 24);
  const [dailyLeadSummaryEnabled, setDailyLeadSummaryEnabled] = useState<boolean>(workspace?.daily_lead_summary_enabled ?? true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (workspace) {
      setName(workspace?.name || "");
      setSlug(workspace?.slug || "");
      setDescription(workspace?.description || "");
      setRetentionDays(workspace?.retention_days || 180);
      setIdempotencyWindowHours(workspace?.idempotency_window_hours || 24);
      setDailyLeadSummaryEnabled(workspace?.daily_lead_summary_enabled ?? true);
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
        slug: slug.trim() || null,
        description,
        retention_days: retentionDays,
        idempotency_window_hours: idempotencyWindowHours,
        daily_lead_summary_enabled: dailyLeadSummaryEnabled,
      });
      if (data.success) {
        // Redireciona para o workspace manager para padrão único de rotas.
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
        logger.error("Workspace id ou name não encontrado");
        return;
      }

      const { data } = await api.patch(`/workspaces/${workspace?.id}`, {
        name,
        slug: slug.trim() || null,
        description,
        retention_days: retentionDays,
        idempotency_window_hours: idempotencyWindowHours,
        daily_lead_summary_enabled: dailyLeadSummaryEnabled,
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
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-[14px]">Informações do workspace</CardTitle>
          <CardDescription className="text-[12px]">Configure os dados principais do workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Workspace</Label>
            <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-[13px]" placeholder="Digite o nome do workspace" required disabled={isSending} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (opcional)</Label>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              className="h-9 text-[13px]"
              placeholder="ex: time-comercial"
              disabled={isSending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} className="text-[13px]" placeholder="Digite uma descrição para o workspace" rows={4} disabled={isSending} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retention_days">Retenção (dias)</Label>
              <Input
                id="retention_days"
                name="retention_days"
                type="number"
                min={1}
                max={3650}
                value={retentionDays}
                className="h-9 text-[13px]"
                onChange={(e) => setRetentionDays(Number(e.target.value || 180))}
                disabled={isSending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idempotency_window_hours">Janela de idempotência (horas)</Label>
              <Input
                id="idempotency_window_hours"
                name="idempotency_window_hours"
                type="number"
                min={1}
                max={720}
                value={idempotencyWindowHours}
                className="h-9 text-[13px]"
                onChange={(e) => setIdempotencyWindowHours(Number(e.target.value || 24))}
                disabled={isSending}
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-[13px] text-foreground">
            <input
              type="checkbox"
              checked={dailyLeadSummaryEnabled}
              onChange={(event) => setDailyLeadSummaryEnabled(event.target.checked)}
              className="h-4 w-4 rounded border-border bg-background"
              disabled={isSending}
            />
            Enviar resumo diário de leads por email para membros do workspace
          </label>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isSending} className="h-9 text-[13px]">
            {workspace && workspace.id ? "Atualizar" : "Criar"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

