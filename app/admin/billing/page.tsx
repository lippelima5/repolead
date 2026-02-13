"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Plus, RefreshCw, Save, Wrench } from "lucide-react";
import AppLayout from "@/components/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import logger from "@/lib/logger.client";

type BillingPlan = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  stripe_price_id: string;
  amount_cents: number | null;
  currency: string;
  interval: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type DraftMap = Record<number, Partial<BillingPlan>>;
type StripeSetupStatus = {
  ready: boolean;
  app_url: string;
  webhook_url: string;
  required_events: string[];
  account: {
    key_configured: boolean;
    connected: boolean;
    id: string | null;
    livemode: boolean | null;
    email: string | null;
    error: string | null;
  };
  webhook: {
    env_secret_configured: boolean;
    env_secret_format_valid: boolean;
    endpoint_id: string | null;
    endpoint_status: string | null;
    endpoint_found: boolean;
    configured_events: string[];
    missing_events: string[];
    has_required_events: boolean;
  };
  plans: {
    total_count: number;
    active_count: number;
    active_valid_count: number;
    invalid_active_plans: Array<{
      id: number;
      key: string;
      stripe_price_id: string;
      reason: string;
    }>;
    remote_validation_error: string | null;
  };
};

type StripeSetupResponse = {
  action: "created" | "updated_events" | "noop";
  endpoint_id: string;
  webhook_url: string;
  webhook_secret: string | null;
  status: StripeSetupStatus;
};

export default function AdminBillingPage() {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingPlanId, setSavingPlanId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [stripeSetup, setStripeSetup] = useState<StripeSetupStatus | null>(null);
  const [isLoadingStripeSetup, setIsLoadingStripeSetup] = useState(true);
  const [isRunningStripeSetup, setIsRunningStripeSetup] = useState(false);
  const [latestWebhookSecret, setLatestWebhookSecret] = useState<string | null>(null);

  const [createPayload, setCreatePayload] = useState({
    key: "",
    stripe_price_id: "",
    sort_order: "0",
    is_active: true,
  });

  const hydrateDrafts = useCallback((items: BillingPlan[]) => {
    const nextDrafts: DraftMap = {};
    for (const plan of items) {
      nextDrafts[plan.id] = { ...plan };
    }
    setDrafts(nextDrafts);
  }, []);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/admin/billing-plan");
      if (data?.success) {
        const items = (data.data || []) as BillingPlan[];
        setPlans(items);
        hydrateDrafts(items);
      }
    } catch (error) {
      logger.error("Erro ao carregar planos", error);
    } finally {
      setIsLoading(false);
    }
  }, [hydrateDrafts]);

  const fetchStripeSetup = useCallback(async () => {
    setIsLoadingStripeSetup(true);
    try {
      const { data } = await api.get("/admin/stripe/setup");
      if (data?.success) {
        setStripeSetup(data.data as StripeSetupStatus);
      }
    } catch (error) {
      logger.error("Erro ao validar setup da Stripe", error);
    } finally {
      setIsLoadingStripeSetup(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([fetchPlans(), fetchStripeSetup()]);
  }, [fetchPlans, fetchStripeSetup]);

  const orderedPlans = useMemo(
    () => [...plans].sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id)),
    [plans],
  );

  const updateDraft = (id: number, field: keyof BillingPlan, value: string | number | boolean | null) => {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }));
  };

  const savePlan = async (id: number) => {
    const draft = drafts[id];
    if (!draft) return;

    try {
      setSavingPlanId(id);
      const payload = {
        key: String(draft.key || "").trim().toUpperCase(),
        stripe_price_id: String(draft.stripe_price_id || "").trim(),
        is_active: Boolean(draft.is_active),
        sort_order: Number(draft.sort_order || 0),
      };

      const { data } = await api.patch(`/admin/billing-plan/${id}`, payload);

      if (data?.success) {
        logger.success("Plano atualizado com sucesso");
        await Promise.all([fetchPlans(), fetchStripeSetup()]);
      }
    } catch (error) {
      logger.error("Erro ao salvar plano", error);
    } finally {
      setSavingPlanId(null);
    }
  };

  const createPlan = async () => {
    try {
      setIsCreating(true);
      const payload = {
        key: createPayload.key.trim().toUpperCase(),
        stripe_price_id: createPayload.stripe_price_id.trim(),
        sort_order: Number(createPayload.sort_order || "0"),
        is_active: createPayload.is_active,
      };

      const { data } = await api.post("/admin/billing-plan", payload);
      if (data?.success) {
        logger.success("Plano criado com sucesso");
        setCreatePayload({
          key: "",
          stripe_price_id: "",
          sort_order: "0",
          is_active: true,
        });
        await Promise.all([fetchPlans(), fetchStripeSetup()]);
      }
    } catch (error) {
      logger.error("Erro ao criar plano", error);
    } finally {
      setIsCreating(false);
    }
  };

  const setupStripeWebhook = async () => {
    try {
      setIsRunningStripeSetup(true);
      const { data } = await api.post("/admin/stripe/setup");

      if (data?.success) {
        const payload = data.data as StripeSetupResponse;
        setStripeSetup(payload.status);
        setLatestWebhookSecret(payload.webhook_secret);
        logger.success(data.message || "Setup Stripe atualizado com sucesso");
      }
    } catch (error) {
      logger.error("Erro ao configurar webhook da Stripe", error);
    } finally {
      setIsRunningStripeSetup(false);
    }
  };

  const formatPrice = (amountCents: number | null, currency: string, interval: string) => {
    if (!amountCents) {
      return "Valor definido na Stripe";
    }

    const money = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountCents / 100);

    return `${money}/${interval}`;
  };

  return (
    <AppLayout
      title="Admin - Billing Plans"
      requireWorkspace={false}
      rightComponent={
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para usuarios
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              void fetchPlans();
              void fetchStripeSetup();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      }
    >
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Stripe setup</CardTitle>
            <CardDescription>
              Valide a conexao, webhook e eventos obrigatorios antes de cadastrar price IDs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingStripeSetup ? (
              <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Validando setup da Stripe...
              </div>
            ) : stripeSetup ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={stripeSetup.ready ? "default" : "secondary"}>
                    {stripeSetup.ready ? "Setup pronto" : "Setup pendente"}
                  </Badge>
                  <Badge variant={stripeSetup.account.connected ? "outline" : "destructive"}>
                    {stripeSetup.account.connected ? "Conectado no Stripe" : "Sem conexao Stripe"}
                  </Badge>
                  <Badge variant={stripeSetup.webhook.endpoint_found ? "outline" : "destructive"}>
                    {stripeSetup.webhook.endpoint_found ? "Webhook encontrado" : "Webhook nao encontrado"}
                  </Badge>
                  <Badge variant={stripeSetup.webhook.has_required_events ? "outline" : "destructive"}>
                    {stripeSetup.webhook.has_required_events ? "Eventos OK" : "Eventos pendentes"}
                  </Badge>
                  <Badge
                    variant={
                      stripeSetup.webhook.env_secret_configured && stripeSetup.webhook.env_secret_format_valid
                        ? "outline"
                        : "destructive"
                    }
                  >
                    {stripeSetup.webhook.env_secret_configured ? "STRIPE_WEBHOOK_SECRET setada" : "Falta STRIPE_WEBHOOK_SECRET"}
                  </Badge>
                </div>

                <div className="text-sm space-y-1 text-muted-foreground">
                  <p>
                    App URL: <span className="font-mono text-foreground">{stripeSetup.app_url}</span>
                  </p>
                  <p>
                    Webhook URL: <span className="font-mono text-foreground">{stripeSetup.webhook_url}</span>
                  </p>
                  <p>
                    Conta Stripe:{" "}
                    <span className="font-mono text-foreground">
                      {stripeSetup.account.id || "nao identificada"} (
                      {stripeSetup.account.livemode === null ? "unknown" : stripeSetup.account.livemode ? "live" : "test"})
                    </span>
                  </p>
                </div>

                {stripeSetup.account.error ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    {stripeSetup.account.error}
                  </div>
                ) : null}

                {stripeSetup.webhook.missing_events.length > 0 ? (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                    <div className="inline-flex items-center gap-2 font-medium">
                      <AlertTriangle className="h-4 w-4" />
                      Eventos faltando no webhook:
                    </div>
                    <p className="mt-2 font-mono text-xs">
                      {stripeSetup.webhook.missing_events.join(", ")}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Eventos obrigatorios configurados.
                  </div>
                )}

                {stripeSetup.plans.remote_validation_error ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    {stripeSetup.plans.remote_validation_error}
                  </div>
                ) : stripeSetup.plans.invalid_active_plans.length > 0 ? (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                    <div className="font-medium">Planos ativos com problema no Stripe:</div>
                    <div className="mt-2 space-y-1">
                      {stripeSetup.plans.invalid_active_plans.map((plan) => (
                        <p key={plan.id} className="font-mono text-xs">
                          {plan.key} ({plan.stripe_price_id}) - {plan.reason}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Price IDs validos: {stripeSetup.plans.active_valid_count}/{stripeSetup.plans.active_count}.
                  </p>
                )}

                {latestWebhookSecret ? (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                    <p className="font-medium">Novo webhook secret gerado:</p>
                    <p className="mt-2 font-mono break-all text-xs">{latestWebhookSecret}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Atualize o `.env` com este valor em `STRIPE_WEBHOOK_SECRET` e reinicie a aplicacao.
                    </p>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => void fetchStripeSetup()} disabled={isLoadingStripeSetup}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Validar setup
                  </Button>
                  <Button onClick={() => void setupStripeWebhook()} disabled={isRunningStripeSetup}>
                    {isRunningStripeSetup ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wrench className="mr-2 h-4 w-4" />
                    )}
                    Configurar webhook automaticamente
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nao foi possivel carregar o setup da Stripe.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Novo plano</CardTitle>
            <CardDescription>
              Informe apenas o `price_id` e a chave interna. Nome, valor, intervalo e descricao sao carregados automaticamente da Stripe.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input placeholder="KEY (ex: PRO_MONTHLY)" value={createPayload.key} onChange={(e) => setCreatePayload((s) => ({ ...s, key: e.target.value }))} />
            <Input placeholder="Stripe price id (price_xxx)" value={createPayload.stripe_price_id} onChange={(e) => setCreatePayload((s) => ({ ...s, stripe_price_id: e.target.value }))} />
            <Input placeholder="Ordem" value={createPayload.sort_order} onChange={(e) => setCreatePayload((s) => ({ ...s, sort_order: e.target.value }))} />

            <label className="text-sm text-muted-foreground inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={createPayload.is_active}
                onChange={(e) => setCreatePayload((s) => ({ ...s, is_active: e.target.checked }))}
              />
              Plano ativo
            </label>

            <div className="md:col-span-2">
              <Button onClick={() => void createPlan()} disabled={isCreating}>
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Criar plano
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planos cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando planos...
              </div>
            ) : orderedPlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum plano cadastrado.</p>
            ) : (
              orderedPlans.map((plan) => {
                const draft = drafts[plan.id] || plan;
                const isSaving = savingPlanId === plan.id;

                return (
                  <div key={plan.id} className="rounded-md border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={draft.is_active ? "default" : "secondary"}>{draft.is_active ? "Ativo" : "Inativo"}</Badge>
                      <span className="text-xs text-muted-foreground">ID {plan.id}</span>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      <Input value={String(draft.key || "")} onChange={(e) => updateDraft(plan.id, "key", e.target.value.toUpperCase())} />
                      <Input value={String(draft.stripe_price_id || "")} onChange={(e) => updateDraft(plan.id, "stripe_price_id", e.target.value)} />
                      <Input value={String(draft.sort_order || 0)} onChange={(e) => updateDraft(plan.id, "sort_order", Number(e.target.value || 0))} />
                    </div>

                    <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-muted-foreground">
                        {formatPrice(plan.amount_cents, plan.currency || "brl", plan.interval || "month")}
                      </p>
                      {plan.description ? <p className="text-muted-foreground">{plan.description}</p> : null}
                    </div>

                    <label className="text-sm text-muted-foreground inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(draft.is_active)}
                        onChange={(e) => updateDraft(plan.id, "is_active", e.target.checked)}
                      />
                      Plano ativo
                    </label>

                    <Button onClick={() => void savePlan(plan.id)} disabled={isSaving}>
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Salvar
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
