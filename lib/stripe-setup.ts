import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { getAppUrl, getStripeClient } from "@/lib/stripe";

export const STRIPE_REQUIRED_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.payment_action_required",
] as const;

export type StripeSetupStatus = {
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

function getWebhookUrl(originFallback?: string) {
  return `${getAppUrl(originFallback)}/api/stripe/webhook`;
}

function getMissingEvents(configuredEvents: string[]) {
  if (configuredEvents.includes("*")) {
    return [];
  }

  return STRIPE_REQUIRED_WEBHOOK_EVENTS.filter((eventName) => !configuredEvents.includes(eventName));
}

function hasRequiredEvents(configuredEvents: string[]) {
  if (configuredEvents.includes("*")) {
    return true;
  }

  return STRIPE_REQUIRED_WEBHOOK_EVENTS.every((eventName) => configuredEvents.includes(eventName));
}

async function findWebhookEndpointByUrl(stripe: Stripe, webhookUrl: string) {
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  return endpoints.data.find((endpoint) => endpoint.url === webhookUrl) || null;
}

async function validateBillingPlanPrices(stripe: Stripe) {
  const activePlans = await prisma.billing_plan.findMany({
    where: { is_active: true },
    select: {
      id: true,
      key: true,
      stripe_price_id: true,
    },
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
  });

  if (activePlans.length === 0) {
    return {
      active_valid_count: 0,
      invalid_active_plans: [] as StripeSetupStatus["plans"]["invalid_active_plans"],
    };
  }

  const checks = await Promise.all(
    activePlans.map(async (plan) => {
      try {
        const price = await stripe.prices.retrieve(plan.stripe_price_id);

        if (!price.active) {
          return { ...plan, valid: false, reason: "Stripe price esta inativo." };
        }

        if (price.type !== "recurring") {
          return { ...plan, valid: false, reason: "Stripe price nao e recorrente (subscription)." };
        }

        return { ...plan, valid: true, reason: "" };
      } catch {
        return { ...plan, valid: false, reason: "Stripe price nao encontrado nesta conta." };
      }
    }),
  );

  const invalid_active_plans = checks
    .filter((plan) => !plan.valid)
    .map(({ id, key, stripe_price_id, reason }) => ({ id, key, stripe_price_id, reason }));

  return {
    active_valid_count: checks.length - invalid_active_plans.length,
    invalid_active_plans,
  };
}

export async function getStripeSetupStatus(originFallback?: string): Promise<StripeSetupStatus> {
  const appUrl = getAppUrl(originFallback);
  const webhookUrl = getWebhookUrl(originFallback);
  const envSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const [totalCount, activeCount] = await Promise.all([
    prisma.billing_plan.count(),
    prisma.billing_plan.count({ where: { is_active: true } }),
  ]);

  const baseStatus: StripeSetupStatus = {
    ready: false,
    app_url: appUrl,
    webhook_url: webhookUrl,
    required_events: [...STRIPE_REQUIRED_WEBHOOK_EVENTS],
    account: {
      key_configured: Boolean(process.env.STRIPE_SECRET_KEY),
      connected: false,
      id: null,
      livemode: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ?? null,
      email: null,
      error: null,
    },
    webhook: {
      env_secret_configured: Boolean(envSecret),
      env_secret_format_valid: Boolean(envSecret?.startsWith("whsec_")),
      endpoint_id: null,
      endpoint_status: null,
      endpoint_found: false,
      configured_events: [],
      missing_events: [...STRIPE_REQUIRED_WEBHOOK_EVENTS],
      has_required_events: false,
    },
    plans: {
      total_count: totalCount,
      active_count: activeCount,
      active_valid_count: 0,
      invalid_active_plans: [],
      remote_validation_error: null,
    },
  };

  if (!process.env.STRIPE_SECRET_KEY) {
    baseStatus.account.error = "STRIPE_SECRET_KEY nao configurada.";
    return baseStatus;
  }

  try {
    const stripe = getStripeClient();
    const account = await stripe.accounts.retrieve();

    baseStatus.account.connected = true;
    baseStatus.account.id = account.id;
    baseStatus.account.email = account.email || null;

    const webhookEndpoint = await findWebhookEndpointByUrl(stripe, webhookUrl);
    if (webhookEndpoint) {
      const configuredEvents = [...webhookEndpoint.enabled_events];
      baseStatus.webhook.endpoint_id = webhookEndpoint.id;
      baseStatus.webhook.endpoint_status = webhookEndpoint.status;
      baseStatus.webhook.endpoint_found = true;
      baseStatus.webhook.configured_events = configuredEvents;
      baseStatus.webhook.missing_events = getMissingEvents(configuredEvents);
      baseStatus.webhook.has_required_events = hasRequiredEvents(configuredEvents);
    }

    try {
      const planValidation = await validateBillingPlanPrices(stripe);
      baseStatus.plans.active_valid_count = planValidation.active_valid_count;
      baseStatus.plans.invalid_active_plans = planValidation.invalid_active_plans;
    } catch {
      baseStatus.plans.remote_validation_error = "Falha ao validar price IDs no Stripe.";
    }
  } catch {
    baseStatus.account.error = "Nao foi possivel conectar ao Stripe com a chave atual.";
    return baseStatus;
  }

  baseStatus.ready =
    baseStatus.account.connected &&
    baseStatus.webhook.endpoint_found &&
    baseStatus.webhook.has_required_events &&
    baseStatus.webhook.env_secret_configured &&
    baseStatus.webhook.env_secret_format_valid &&
    baseStatus.plans.invalid_active_plans.length === 0;

  return baseStatus;
}

export async function ensureStripeWebhookSetup(originFallback?: string) {
  const stripe = getStripeClient();
  const webhookUrl = getWebhookUrl(originFallback);

  const existingEndpoint = await findWebhookEndpointByUrl(stripe, webhookUrl);

  if (!existingEndpoint) {
    const createdEndpoint = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [...STRIPE_REQUIRED_WEBHOOK_EVENTS],
      description: "VibeKit workspace subscription sync",
      metadata: {
        app: "vibekit",
        managed_by: "admin-setup",
      },
    });

    return {
      action: "created" as const,
      endpoint_id: createdEndpoint.id,
      webhook_url: webhookUrl,
      webhook_secret: createdEndpoint.secret || null,
    };
  }

  const currentEvents = [...existingEndpoint.enabled_events];
  const missingEvents = getMissingEvents(currentEvents);

  if (missingEvents.length > 0) {
    await stripe.webhookEndpoints.update(existingEndpoint.id, {
      enabled_events: [...STRIPE_REQUIRED_WEBHOOK_EVENTS],
    });

    return {
      action: "updated_events" as const,
      endpoint_id: existingEndpoint.id,
      webhook_url: webhookUrl,
      webhook_secret: null,
    };
  }

  return {
    action: "noop" as const,
    endpoint_id: existingEndpoint.id,
    webhook_url: webhookUrl,
    webhook_secret: null,
  };
}
