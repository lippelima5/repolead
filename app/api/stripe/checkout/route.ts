import { NextRequest } from "next/server";
import { onError, verifyUserWorkspace } from "@/lib/helper";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getAppUrl, getStripeClient } from "@/lib/stripe";
import { parseJsonBody } from "@/lib/validation";
import { stripeCheckoutBodySchema } from "@/lib/schemas";
import { hasWorkspacePaidPlan } from "@/lib/workspace-plan";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { workspace_id, planKey } = await parseJsonBody(request, stripeCheckoutBodySchema);
    const stripe = getStripeClient();

    const { workspaceUser, user } = await verifyUserWorkspace(request, true, workspace_id);

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceUser.workspace_id },
      select: {
        id: true,
        name: true,
        plan_status: true,
        stripe_subscription_id: true,
        stripe_customer_id: true,
      },
    });

    if (!workspace) {
      return apiError("Workspace not found", 404);
    }

    if (hasWorkspacePaidPlan(workspace)) {
      return apiError("Workspace already has active paid subscription. Use billing portal.", 409);
    }

    const selectedPlan = await prisma.billing_plan.findFirst({
      where: {
        key: planKey,
        is_active: true,
      },
      select: {
        key: true,
        stripe_price_id: true,
      },
    });

    if (!selectedPlan) {
      return apiError("Selected plan is not available", 404);
    }

    let customerId = workspace.stripe_customer_id ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        name: workspace.name,
        email: user.email,
        metadata: { workspaceId: String(workspace.id) },
      });
      customerId = customer.id;

      await prisma.workspace.update({
        where: { id: workspace.id },
        data: { stripe_customer_id: customerId },
      });
    }

    const appUrl = getAppUrl(request.nextUrl.origin);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: selectedPlan.stripe_price_id, quantity: 1 }],
      allow_promotion_codes: true,
      client_reference_id: String(workspace.id),
      metadata: {
        workspaceId: String(workspace.id),
        planKey: selectedPlan.key,
      },
      success_url: `${appUrl}/workspaces/${workspace.id}?billing=success`,
      cancel_url: `${appUrl}/workspaces/${workspace.id}/billing?billing=cancelled`,
    });

    if (!session.url) {
      return apiError("Failed to create checkout session", 500);
    }

    return apiSuccess({
      url: session.url,
    });
  } catch (error) {
    return onError(error);
  }
}
