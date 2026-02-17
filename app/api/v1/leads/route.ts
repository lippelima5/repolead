import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiRateLimit, apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { buildLeadWhereInput, parseLeadFiltersFromSearchParams } from "@/lib/leadvault/leads-query";
import {
  checkWorkspaceReadApiKeyLimit,
  requireWorkspaceReadApiKey,
  touchWorkspaceReadApiKey,
} from "@/lib/leadvault/read-api-key";

export async function GET(request: NextRequest) {
  try {
    const apiKey = await requireWorkspaceReadApiKey(request);
    const limitResult = await checkWorkspaceReadApiKeyLimit(apiKey.id);
    if (limitResult.limited) {
      return apiRateLimit("API read rate limit exceeded", limitResult.retryAfterSeconds);
    }

    const filters = parseLeadFiltersFromSearchParams(request.nextUrl.searchParams, {
      defaultLimit: 20,
      maxLimit: 200,
    });
    const where = buildLeadWhereInput(apiKey.workspaceId, filters);

    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          identities: {
            select: {
              id: true,
              type: true,
              value: true,
              normalized_value: true,
              source_id: true,
            },
            orderBy: { created_at: "asc" },
          },
        },
        orderBy: { created_at: "desc" },
        skip: filters.offset,
        take: filters.limit,
      }),
      prisma.lead.count({ where }),
      touchWorkspaceReadApiKey(apiKey.id),
    ]);

    return apiSuccess({
      items,
      meta: {
        total,
        limit: filters.limit,
        offset: filters.offset,
      },
    });
  } catch (error) {
    return onError(error);
  }
}
