import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/client";
import { apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { parseJsonBody } from "@/lib/validation";
import { sourceCreateBodySchema } from "@/lib/schemas";
import { requireWorkspace } from "@/lib/leadvault/workspace";

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const status = request.nextUrl.searchParams.get("status")?.trim();
    const limit = Math.min(200, Number(request.nextUrl.searchParams.get("limit") || 20));
    const offset = Math.max(0, Number(request.nextUrl.searchParams.get("offset") || 0));

    const statusFilter = status === "active" || status === "inactive" ? status : undefined;
    const where: Prisma.sourceWhereInput = {
      workspace_id: workspaceId,
      ...(search
        ? {
            OR: [{ name: { contains: search, mode: "insensitive" as const } }, { type: { contains: search, mode: "insensitive" as const } }],
          }
        : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.source.findMany({
        where,
        include: {
          _count: {
            select: {
              ingestions: true,
              api_keys: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.source.count({ where }),
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

export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace(request, { requireAdmin: true });
    const body = await parseJsonBody(request, sourceCreateBodySchema);

    const source = await prisma.source.create({
      data: {
        workspace_id: workspaceId,
        name: body.name,
        type: body.type,
        environment: body.environment,
        rate_limit_per_min: body.rate_limit_per_min,
        status: body.status,
      },
    });

    return apiSuccess(source, {
      status: 201,
      message: "Source created",
    });
  } catch (error) {
    return onError(error);
  }
}
