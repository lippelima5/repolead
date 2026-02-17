import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { requireWorkspace } from "@/lib/leadvault/workspace";

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const query = request.nextUrl.searchParams.get("query")?.trim();
    const status = request.nextUrl.searchParams.get("status")?.trim();
    const sourceId = request.nextUrl.searchParams.get("source")?.trim();
    const tag = request.nextUrl.searchParams.get("tag")?.trim();
    const limit = Math.min(200, Number(request.nextUrl.searchParams.get("limit") || 20));
    const offset = Math.max(0, Number(request.nextUrl.searchParams.get("offset") || 0));

    const where = {
      workspace_id: workspaceId,
      ...(status ? { status: status as "new" | "contacted" | "qualified" | "won" | "lost" | "needs_identity" } : {}),
      ...(tag
        ? {
            tags_json: {
              array_contains: [tag],
            },
          }
        : {}),
      ...(sourceId
        ? {
            identities: {
              some: {
                source_id: sourceId,
              },
            },
          }
        : {}),
      ...(query
        ? {
            OR: [
              { id: { contains: query, mode: "insensitive" as const } },
              { name: { contains: query, mode: "insensitive" as const } },
              { email: { contains: query, mode: "insensitive" as const } },
              { phone: { contains: query, mode: "insensitive" as const } },
              {
                identities: {
                  some: {
                    OR: [
                      { value: { contains: query, mode: "insensitive" as const } },
                      { normalized_value: { contains: query, mode: "insensitive" as const } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

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
        skip: offset,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return apiSuccess({
      items,
      meta: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    return onError(error);
  }
}
