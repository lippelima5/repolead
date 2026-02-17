"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, Crown, Star, Zap } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import AppLayout from "@/components/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { canManageWorkspace } from "@/lib/workspace-permissions";
import { hasWorkspacePaidPlan } from "@/lib/workspace-plan";
import { WorkspaceRelations } from "@/types";

type BillingPlan = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  amount_cents: number | null;
  currency: string;
  interval: string;
  sort_order: number;
  marketing_features?: string[];
};

const PLAN_ICONS = [Zap, Star, Crown];

export default function BillingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const workspaceId = params.workspaceId as string;
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceRelations | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  useEffect(() => {
    const fetchWorkspace = async () => {
      setIsLoadingWorkspace(true);
      try {
        const { data } = await api.get(`/workspace/${workspaceId}`);
        if (data.success) {
          setWorkspace(data.data);
        }
      } catch (error) {
        logger.error("Erro ao carregar workspace", error);
        router.push("/dashboard/settings/workspace");
      } finally {
        setIsLoadingWorkspace(false);
      }
    };

    void fetchWorkspace();
  }, [router, workspaceId]);

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const { data } = await api.get("/billing-plan");
        if (data?.success) {
          setPlans(data.data || []);
        }
      } catch (error) {
        logger.error("Erro ao carregar planos", error);
      } finally {
        setIsLoadingPlans(false);
      }
    };

    void fetchPlans();
  }, []);

  const currentWorkspaceRole = useMemo(() => {
    if (!workspace || !user) return null;
    const membership = workspace.users.find((item) => item.user_id === user.id);
    return membership?.role ?? null;
  }, [workspace, user]);

  const canManage = canManageWorkspace(currentWorkspaceRole);
  const hasPaidPlan = hasWorkspacePaidPlan(workspace);

  async function startCheckout(planKey: string) {
    if (!canManage) {
      logger.error("Voce nao tem permissao para alterar o plano deste workspace");
      return;
    }

    try {
      setLoadingKey(planKey);
      const { data } = await api.post("/stripe/checkout", {
        workspace_id: Number(workspaceId),
        planKey,
      });

      const redirectUrl = data?.data?.url;
      if (redirectUrl) window.location.href = redirectUrl;
      else throw new Error(data.message || "Falha ao abrir checkout");
    } catch (error) {
      logger.error("Erro ao iniciar checkout", error);
    } finally {
      setLoadingKey(null);
    }
  }

  const formatPrice = (priceInCents: number | null, currency: string) => {
    if (!priceInCents) {
      return "Consulte o valor no checkout";
    }

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(priceInCents / 100);
  };

  const openPortal = async () => {
    if (!canManage) {
      logger.error("Voce nao tem permissao para gerenciar cobranca deste workspace");
      return;
    }

    try {
      if (!workspaceId) throw new Error("workspaceId is required");

      const { data } = await api.post("/stripe/portal", { workspace_id: Number(workspaceId) });
      const redirectUrl = data?.data?.url;
      if (redirectUrl) window.location.href = redirectUrl;
    } catch (error) {
      logger.error("Erro ao abrir portal de cobranca", error);
    }
  };

  const orderedPlans = useMemo(
    () => [...plans].sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id)),
    [plans],
  );

  const getPlanHighlights = (plan: BillingPlan) => {
    const fromStripe = (plan.marketing_features || []).slice(0, 4);

    if (fromStripe.length > 0) {
      return fromStripe;
    }

    return [
      `Mais recursos para o time no plano ${plan.name}`,
      "Suporte para crescimento continuo do workspace",
      "Cobranca mensal simples e previsivel",
    ];
  };

  return (
    <AppLayout
      title={hasPaidPlan ? "Gerenciar assinatura" : "Escolha seu plano"}
      isLoading={isLoadingWorkspace}
      rightComponent={
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
      }
    >
      <div className="mx-auto max-w-7xl p-6">
        {!isLoadingWorkspace && !canManage ? (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            Apenas administradores ou owners podem gerenciar billing deste workspace.
          </div>
        ) : null}

        {hasPaidPlan ? (
          <Card>
            <CardHeader>
              <CardTitle>Assinatura ativa</CardTitle>
              <CardDescription>
                Seu workspace ja esta com um plano ativo. Voce pode revisar faturamento, forma de pagamento e renovacao em um unico lugar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={openPortal} disabled={!canManage}>
                Abrir central da assinatura
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Planos disponiveis</h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
                Escolha o plano ideal para liberar recursos premium e escalar seu workspace com tranquilidade.
              </p>
            </div>

            {isLoadingPlans ? (
              <div className="text-sm text-muted-foreground">Carregando planos...</div>
            ) : orderedPlans.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Nenhum plano disponivel</CardTitle>
                  <CardDescription>
                    Um administrador precisa cadastrar planos no painel /admin/billing.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {orderedPlans.map((plan, index) => {
                  const IconComponent = PLAN_ICONS[index % PLAN_ICONS.length];
                  const isLoading = loadingKey === plan.key;

                  return (
                    <Card key={plan.id} className="relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl min-w-sm">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-30  " />

                      <CardHeader className="relative items-center justify-center pb-4 text-center">
                        <div className="mx-auto mb-4 w-fit rounded-full bg-primary p-3">
                          <IconComponent className="h-6 w-6 text-primary-foreground" />
                        </div>

                        <CardTitle className="mb-2 text-xl font-bold">{plan.name}</CardTitle>

                        <div className="mb-2">
                          <span className="text-2xl font-bold">{formatPrice(plan.amount_cents, plan.currency || "BRL")}</span>
                          <span className="text-sm text-muted-foreground">/{plan.interval}</span>
                        </div>

                        <div>
                          <Badge variant="outline">{plan.key}</Badge>
                          {plan.description ? <CardDescription className="mt-2 text-sm">{plan.description}</CardDescription> : null}
                        </div>

                      </CardHeader>

                      <CardContent className="relative z-10">
                        <ul className="mb-6 space-y-2">
                          {getPlanHighlights(plan).map((feature) => (
                            <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>

                        <Button
                          className="w-full"
                          disabled={isLoading || !canManage}
                          onClick={() => void startCheckout(plan.key)}
                          size="lg"
                        >
                          {isLoading ? "Abrindo checkout..." : "Quero este plano"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
