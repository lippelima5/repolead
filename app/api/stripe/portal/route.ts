import { NextRequest } from "next/server";
import { onError, verifyUserWorkspace } from "@/lib/helper";
import { apiError, apiSuccess } from "@/lib/api-response";
import prisma from "@/lib/prisma";
import { getAppUrl, getStripeClient } from "@/lib/stripe";
import { parseJsonBody } from "@/lib/validation";
import { stripePortalBodySchema } from "@/lib/schemas";
import { hasWorkspacePaidPlan } from "@/lib/workspace-plan";

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient();
    const { workspace_id } = await parseJsonBody(request, stripePortalBodySchema);

    const { workspaceUser, user } = await verifyUserWorkspace(request, true, workspace_id);

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceUser.workspace_id } });
    if (!workspace) {
      return apiError("Workspace not found", 404);
    }

    if (!hasWorkspacePaidPlan(workspace)) {
      return apiError("Workspace has no active paid subscription", 409);
    }

    let customerId = workspace.stripe_customer_id ?? undefined;

    if (!customerId && workspace.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(workspace.stripe_subscription_id);
        customerId = String(subscription.customer);
      } catch {
        customerId = undefined;
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        name: workspace.name,
        email: user.email,
        metadata: { workspaceId: String(workspace.id) },
      });
      customerId = customer.id;
    }

    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { stripe_customer_id: customerId },
    });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getAppUrl(request.nextUrl.origin)}/workspaces/${workspace.id}`,
    });

    return apiSuccess({
      url: session.url,
    });
  } catch (error) {
    return onError(error);
  }
}


