import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError, verifyUser } from "@/lib/helper";
import { ensureStripeWebhookSetup, getStripeSetupStatus } from "@/lib/stripe-setup";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await verifyUser(request, true);

    const status = await getStripeSetupStatus(request.nextUrl.origin);
    return apiSuccess(status);
  } catch (error) {
    return onError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifyUser(request, true);

    if (!process.env.STRIPE_SECRET_KEY) {
      return apiError("STRIPE_SECRET_KEY nao configurada.", 400);
    }

    const setupResult = await ensureStripeWebhookSetup(request.nextUrl.origin);
    const status = await getStripeSetupStatus(request.nextUrl.origin);

    const actionMessage =
      setupResult.action === "created"
        ? "Webhook criado no Stripe com os eventos obrigatorios."
        : setupResult.action === "updated_events"
          ? "Webhook atualizado com os eventos obrigatorios."
          : "Webhook ja estava configurado com os eventos obrigatorios.";

    return apiSuccess(
      {
        ...setupResult,
        status,
      },
      {
        message: actionMessage,
      },
    );
  } catch (error) {
    return onError(error);
  }
}
