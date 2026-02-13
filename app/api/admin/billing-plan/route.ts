import { NextRequest } from "next/server";
import { onError, verifyUser } from "@/lib/helper";
import { apiSuccess } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/validation";
import { adminBillingPlanCreateBodySchema } from "@/lib/schemas";
import { fetchStripePlanSnapshot } from "@/lib/stripe-plan";
import { CustomError } from "@/lib/errors";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await verifyUser(request, true);

    const plans = await prisma.billing_plan.findMany({
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
    });

    return apiSuccess(plans);
  } catch (error) {
    return onError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifyUser(request, true);

    const payload = await parseJsonBody(request, adminBillingPlanCreateBodySchema);
    let snapshot;

    try {
      snapshot = await fetchStripePlanSnapshot(payload.stripe_price_id);
    } catch (error) {
      throw new CustomError(
        error instanceof Error ? `Nao foi possivel validar price_id na Stripe: ${error.message}` : "Price ID invalido na Stripe",
        400,
      );
    }

    const plan = await prisma.billing_plan.create({
      data: {
        key: payload.key,
        name: snapshot.name,
        description: snapshot.description,
        stripe_price_id: payload.stripe_price_id,
        amount_cents: snapshot.amount_cents,
        currency: snapshot.currency,
        interval: snapshot.interval,
        is_active: payload.is_active ?? true,
        sort_order: payload.sort_order ?? 0,
      },
    });

    return apiSuccess(plan, {
      status: 201,
      message: "Billing plan created successfully",
    });
  } catch (error) {
    return onError(error);
  }
}
