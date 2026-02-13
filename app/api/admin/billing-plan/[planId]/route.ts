import { NextRequest } from "next/server";
import { onError, verifyUser } from "@/lib/helper";
import { apiError, apiSuccess } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/validation";
import { adminBillingPlanUpdateBodySchema } from "@/lib/schemas";
import { fetchStripePlanSnapshot } from "@/lib/stripe-plan";
import { CustomError } from "@/lib/errors";
import prisma from "@/lib/prisma";

function parsePlanId(value: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  try {
    await verifyUser(request, true);

    const { planId } = await params;
    const parsedPlanId = parsePlanId(planId);

    if (!parsedPlanId) {
      return apiError("Invalid plan id", 400);
    }

    const payload = await parseJsonBody(request, adminBillingPlanUpdateBodySchema);

    const existing = await prisma.billing_plan.findUnique({ where: { id: parsedPlanId } });
    if (!existing) {
      return apiError("Billing plan not found", 404);
    }

    const shouldSyncStripeSnapshot = Boolean(payload.stripe_price_id);
    const stripePriceId = payload.stripe_price_id || existing.stripe_price_id;

    let stripeSnapshot: Awaited<ReturnType<typeof fetchStripePlanSnapshot>> | null = null;

    if (shouldSyncStripeSnapshot) {
      try {
        stripeSnapshot = await fetchStripePlanSnapshot(stripePriceId);
      } catch (error) {
        throw new CustomError(
          error instanceof Error ? `Nao foi possivel validar price_id na Stripe: ${error.message}` : "Price ID invalido na Stripe",
          400,
        );
      }
    }

    const plan = await prisma.billing_plan.update({
      where: { id: parsedPlanId },
      data: {
        ...(payload.key ? { key: payload.key } : {}),
        ...(payload.stripe_price_id ? { stripe_price_id: payload.stripe_price_id } : {}),
        ...(stripeSnapshot
          ? {
              name: stripeSnapshot.name,
              description: stripeSnapshot.description,
              amount_cents: stripeSnapshot.amount_cents,
              currency: stripeSnapshot.currency,
              interval: stripeSnapshot.interval,
            }
          : {}),
        ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
        ...(payload.sort_order !== undefined ? { sort_order: payload.sort_order } : {}),
      },
    });

    return apiSuccess(plan, {
      message: "Billing plan updated successfully",
    });
  } catch (error) {
    return onError(error);
  }
}
