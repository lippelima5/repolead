import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError, verifyUser } from "@/lib/helper";
import prisma from "@/lib/prisma";
import { feedbackCreateBodySchema } from "@/lib/schemas";
import { parseJsonBody } from "@/lib/validation";

const FEEDBACK_WEBHOOK_URL = "https://auto.markware.com.br/webhook/f91edd3b-c15d-4e06-928d-f53ca4c57ca0";
const FEEDBACK_TIMEOUT_MS = 10_000;

async function postFeedbackWebhook(payload: Record<string, unknown>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FEEDBACK_TIMEOUT_MS);

  try {
    return await fetch(FEEDBACK_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await verifyUser(request);
    const body = await parseJsonBody(request, feedbackCreateBodySchema);

    const workspace = user.workspace_active_id
      ? await prisma.workspace.findUnique({
          where: { id: user.workspace_active_id },
          select: { id: true, name: true, slug: true },
        })
      : null;

    const payload = {
      event: "user_feedback_submitted",
      created_at: new Date().toISOString(),
      feedback: {
        category: body.category,
        title: body.title,
        description: body.description,
        page: body.page ?? null,
        user_agent: request.headers.get("user-agent") ?? null,
      },
      user: {
        id: user.id,
        name: body.name || user.name || user.email,
        email: body.email || user.email,
        role: user.role,
      },
      workspace: workspace
        ? {
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
          }
        : null,
    };

    let webhookResponse: Response;
    try {
      webhookResponse = await postFeedbackWebhook(payload);
    } catch {
      return apiError("Feedback webhook is unavailable", 502);
    }

    if (!webhookResponse.ok) {
      return apiError("Feedback webhook returned an error", 502);
    }

    return apiSuccess(
      {
        delivered: true,
      },
      {
        status: 201,
        message: "Feedback sent",
      },
    );
  } catch (error) {
    return onError(error);
  }
}
