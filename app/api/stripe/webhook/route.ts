import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import logger from "@/lib/logger.server";
import prisma from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

type WorkspacePlanStatus = "active" | "trialing" | "pending" | "inactive";

function toDateOrNull(epochSeconds?: number | null) {
  return epochSeconds ? new Date(epochSeconds * 1000) : null;
}

function toWorkspacePlanStatus(status: Stripe.Subscription.Status): WorkspacePlanStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "incomplete":
    case "incomplete_expired":
    case "past_due":
    case "unpaid":
    case "paused":
      return "pending";
    case "canceled":
      return "inactive";
    default:
      return "inactive";
  }
}

async function findWorkspaceByCustomer(customerId: string) {
  return prisma.workspace.findFirst({ where: { stripe_customer_id: customerId } });
}

async function findWorkspaceByReference(clientReferenceId: string | null | undefined) {
  if (!clientReferenceId) return null;

  const workspaceId = Number(clientReferenceId);
  if (!Number.isFinite(workspaceId)) return null;

  return prisma.workspace.findUnique({ where: { id: workspaceId } });
}

async function applySubscriptionState(subscription: Stripe.Subscription) {
  const customerId = subscription.customer ? String(subscription.customer) : null;
  if (!customerId) return;

  const workspace =
    (await findWorkspaceByCustomer(customerId)) ||
    (await findWorkspaceByReference(subscription.metadata?.workspaceId || null));

  if (!workspace) {
    logger.warn("Workspace not found for subscription", {
      customerId,
      subscriptionId: subscription.id,
    });
    return;
  }

  const periodEnd = toDateOrNull(subscription.items.data?.[0]?.current_period_end || null);
  const mappedStatus = toWorkspacePlanStatus(subscription.status);

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.status === "canceled" ? null : subscription.id,
      plan_status: mappedStatus,
      plan_expires_at: mappedStatus === "inactive" ? null : periodEnd,
    },
  });

  logger.info("Subscription state applied", {
    workspaceId: workspace.id,
    subscriptionId: subscription.id,
    status: mappedStatus,
  });
}

async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const stripe = getStripeClient();
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.mode !== "subscription") return;

  const workspace = await findWorkspaceByReference(session.client_reference_id);
  if (!workspace) {
    logger.warn("Workspace not found for checkout session", { sessionId: session.id });
    return;
  }

  const customerId = session.customer ? String(session.customer) : null;
  const subscriptionId = session.subscription ? String(session.subscription) : null;

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      ...(customerId && { stripe_customer_id: customerId }),
      ...(subscriptionId && { stripe_subscription_id: subscriptionId }),
      ...(subscriptionId && { plan_status: "pending" }),
    },
  });

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await applySubscriptionState(subscription);
  }
}

async function handleSubscriptionEvent(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  await applySubscriptionState(subscription);
}

async function handleInvoiceEvent(event: Stripe.Event) {
  const stripe = getStripeClient();
  const invoice = event.data.object as Stripe.Invoice;
  const customerId = invoice.customer ? String(invoice.customer) : null;

  if (!customerId) return;

  const workspace = await findWorkspaceByCustomer(customerId);
  if (!workspace) {
    logger.warn("Workspace not found for invoice event", { invoiceId: invoice.id, customerId });
    return;
  }

  if (event.type === "invoice.payment_failed" || event.type === "invoice.payment_action_required") {
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { plan_status: "pending" },
    });
    return;
  }

  const subscriptionId =
    (invoice as Stripe.Invoice & { subscription?: string | null }).subscription ||
    (invoice as Stripe.Invoice & { parent?: { subscription_details?: { subscription?: string | null } } }).parent
      ?.subscription_details?.subscription ||
    null;

  if (event.type === "invoice.paid" && subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(String(subscriptionId));
    await applySubscriptionState(subscription);
  }
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripeClient();
    const signature = req.headers.get("stripe-signature");
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !endpointSecret) {
      return NextResponse.json({ success: false, message: "Webhook signature missing" }, { status: 400 });
    }

    const rawBody = Buffer.from(await req.arrayBuffer()).toString("utf8");

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    } catch (err) {
      logger.error("Stripe webhook signature verification failed", err);
      return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(event);
        break;
      case "invoice.paid":
      case "invoice.payment_failed":
      case "invoice.payment_action_required":
        await handleInvoiceEvent(event);
        break;
      default:
        logger.info("Stripe event ignored", { eventType: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error("Stripe webhook error", err);
    return NextResponse.json({ received: true });
  }
}
