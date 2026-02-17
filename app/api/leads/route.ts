import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { requireWorkspace } from "@/lib/repolead/workspace";
import { buildLeadWhereInput, parseLeadFiltersFromSearchParams } from "@/lib/repolead/leads-query";

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const filters = parseLeadFiltersFromSearchParams(request.nextUrl.searchParams, {
      defaultLimit: 20,
      maxLimit: 200,
    });
    const where = buildLeadWhereInput(workspaceId, filters);

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
          _count: {
            select: {
              deliveries: true,
              events: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip: filters.offset,
        take: filters.limit,
      }),
      prisma.lead.count({ where }),
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
