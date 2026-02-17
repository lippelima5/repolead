import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiRateLimit, apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import {
  checkWorkspaceReadApiKeyLimit,
  requireWorkspaceReadApiKey,
  touchWorkspaceReadApiKey,
} from "@/lib/repolead/read-api-key";

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
      include: {
        identities: {
          orderBy: { created_at: "asc" },
        },
      },
    });

    if (!lead) {
      return apiError("Lead not found", 404);
    }

    void touchWorkspaceReadApiKey(apiKey.id);

    return apiSuccess(lead);
  } catch (error) {
    return onError(error);
  }
}
