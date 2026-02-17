import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { requireWorkspace } from "@/lib/repolead/workspace";

function parseDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const sourceId = request.nextUrl.searchParams.get("sourceId")?.trim();
    const query = request.nextUrl.searchParams.get("query")?.trim();
    const from = parseDate(request.nextUrl.searchParams.get("from"));
    const to = parseDate(request.nextUrl.searchParams.get("to"));
    const limit = Math.min(200, Number(request.nextUrl.searchParams.get("limit") || 20));
    const offset = Math.max(0, Number(request.nextUrl.searchParams.get("offset") || 0));

    const where = {
      workspace_id: workspaceId,
      ...(sourceId ? { source_id: sourceId } : {}),
      ...(query ? { id: { contains: query, mode: "insensitive" as const } } : {}),
      ...(from || to
        ? {
            received_at: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.ingestion.findMany({
        where,
        include: {
          source: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: { received_at: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.ingestion.count({ where }),
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
