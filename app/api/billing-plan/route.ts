import { NextRequest } from "next/server";
import { onError, verifyUser } from "@/lib/helper";
import { apiSuccess } from "@/lib/api-response";
import prisma from "@/lib/prisma";
import { fetchStripePlanSnapshot } from "@/lib/stripe-plan";

export async function GET(request: NextRequest) {
  try {
    await verifyUser(request);

    const plans = await prisma.billing_plan.findMany({
      where: { is_active: true },
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        amount_cents: true,
        currency: true,
        interval: true,
        stripe_price_id: true,
        sort_order: true,
      },
    });

    const enrichedPlans = await Promise.all(
      plans.map(async (plan) => {
        try {
          const snapshot = await fetchStripePlanSnapshot(plan.stripe_price_id);

          return {
            ...plan,
            name: snapshot.name,
            description: snapshot.description,
            amount_cents: snapshot.amount_cents,
            currency: snapshot.currency,
            interval: snapshot.interval,
            marketing_features: snapshot.marketing_features,
          };
        } catch {
          return {
            ...plan,
            marketing_features: [],
          };
        }
      }),
    );

    return apiSuccess(enrichedPlans);
  } catch (error) {
    return onError(error);
  }
}
