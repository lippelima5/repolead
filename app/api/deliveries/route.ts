import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { requireWorkspace } from "@/lib/repolead/workspace";
import { parseQueryInt } from "@/lib/validation";

function parseDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const status = request.nextUrl.searchParams.get("status")?.trim();
    const destinationId = request.nextUrl.searchParams.get("destinationId")?.trim();
    const leadId = request.nextUrl.searchParams.get("leadId")?.trim();
    const from = parseDate(request.nextUrl.searchParams.get("from"));
    const to = parseDate(request.nextUrl.searchParams.get("to"));
    const limit = parseQueryInt(request.nextUrl.searchParams.get("limit"), {
      defaultValue: 20,
      min: 1,
      max: 200,
    });
    const offset = parseQueryInt(request.nextUrl.searchParams.get("offset"), {
      defaultValue: 0,
      min: 0,
    });

    const where = {
      workspace_id: workspaceId,
      ...(status ? { status: status as "pending" | "success" | "failed" | "dead_letter" } : {}),
      ...(destinationId ? { destination_id: destinationId } : {}),
      ...(leadId ? { lead_id: leadId } : {}),
      ...(from || to
        ? {
            created_at: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        include: {
          destination: {
            select: {
              id: true,
              name: true,
            },
          },
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.delivery.count({ where }),
    ]);

    return apiSuccess({
      items,
      meta: { total, limit, offset },
    });
  } catch (error) {
    return onError(error);
  }
}
