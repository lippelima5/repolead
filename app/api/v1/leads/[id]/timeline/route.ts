import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiRateLimit, apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import {
  checkWorkspaceReadApiKeyLimit,
  requireWorkspaceReadApiKey,
  touchWorkspaceReadApiKey,
} from "@/lib/leadvault/read-api-key";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const apiKey = await requireWorkspaceReadApiKey(request);
    const limitResult = await checkWorkspaceReadApiKeyLimit(apiKey.id);
    if (limitResult.limited) {
      return apiRateLimit("API read rate limit exceeded", limitResult.retryAfterSeconds);
    }

    const leadId = (await params).id;

    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        workspace_id: apiKey.workspaceId,
      },
      select: { id: true },
    });

    if (!lead) {
      return apiError("Lead not found", 404);
    }

    const timeline = await prisma.lead_event.findMany({
      where: {
        workspace_id: apiKey.workspaceId,
        lead_id: leadId,
      },
      include: {
        ingestion: {
          select: {
            id: true,
            source_id: true,
            received_at: true,
            source: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        delivery: {
          select: {
            id: true,
            event_type: true,
            status: true,
            attempt_count: true,
            last_error: true,
            destination: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { timestamp: "desc" },
    });

    void touchWorkspaceReadApiKey(apiKey.id);

    return apiSuccess(timeline);
  } catch (error) {
    return onError(error);
  }
}
