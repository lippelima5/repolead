"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, CreditCard, Settings, Shield } from "lucide-react";
import AppLayout from "@/components/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { hasWorkspacePaidPlan } from "@/lib/workspace-plan";

type ActiveWorkspace = {
  id: number;
  name: string;
  plan_status: "active" | "trialing" | "pending" | "inactive" | "canceled" | "expired";
  stripe_subscription_id: string | null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeWorkspace, setActiveWorkspace] = useState<ActiveWorkspace | null>(null);

  useEffect(() => {
    const workspaceId = user?.workspace_active_id;
    if (!workspaceId) {
      return;
    }

    const fetchWorkspace = async () => {
      try {
        const { data } = await api.get(`/workspace/${workspaceId}`);
        if (data?.success) {
          setActiveWorkspace({
            id: data.data.id,
            name: data.data.name,
            plan_status: data.data.plan_status,
            stripe_subscription_id: data.data.stripe_subscription_id,
          });
        }
      } catch (error) {
        logger.error("Erro ao carregar workspace ativo", error);
      }
    };

    void fetchWorkspace();
  }, [user?.workspace_active_id]);

  const currentActiveWorkspace =
    activeWorkspace && activeWorkspace.id === user?.workspace_active_id ? activeWorkspace : null;
  const hasPaidPlan = hasWorkspacePaidPlan(currentActiveWorkspace);

  return (
    <AppLayout title="Dashboard">
      <main className="flex-1 space-y-6 p-4 lg:p-8 min-w-0">
        <Card>
          <CardHeader>
            <CardTitle>
              Visao geral {" "}
              {user?.suspended_at ? <Badge variant="destructive">Conta suspensa</Badge> : <Badge variant="outline">Conta ativa</Badge>}
            </CardTitle>
            <CardDescription>Bem-vindo ao VibeKit. Este e o ponto de entrada para sua operacao.</CardDescription>
          </CardHeader>
        </Card>

        {currentActiveWorkspace && !hasPaidPlan ? (
          <Card className="border-amber-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" />
                Assinatura pendente para {currentActiveWorkspace.name}
              </CardTitle>
              <CardDescription>
                Seu workspace esta no plano gratuito. Assine para liberar recursos pagos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={`/dashboard/settings/workspace/${currentActiveWorkspace.id}/billing`}>Assinar agora</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {currentActiveWorkspace && hasPaidPlan ? (
          <Card className="border-emerald-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" />
                Assinatura ativa em {currentActiveWorkspace.name}
              </CardTitle>
              <CardDescription>Gerencie alteracoes de plano e cobranca direto no portal da Stripe.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href={`/dashboard/settings/workspace/${currentActiveWorkspace.id}/billing`}>Gerenciar assinatura</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Workspaces
              </CardTitle>
              <CardDescription>Gerencie membros, permissoes e configuracoes de workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/settings/workspace">Abrir workspaces</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4" />
                Perfil e ajustes
              </CardTitle>
              <CardDescription>Atualize dados da conta, senha e configuracoes pessoais.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/profile">Abrir perfil</Link>
              </Button>
            </CardContent>
          </Card>

          {user?.role === "admin" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4" />
                  Painel global
                </CardTitle>
                <CardDescription>Area de Super Admin para gestao global de usuarios e billing.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin">Abrir /admin</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>
    </AppLayout>
  );
}
