import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/client";
import { apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { CustomError } from "@/lib/errors";
import { parseJsonBody, parseQueryInt } from "@/lib/validation";
import { sourceCreateBodySchema } from "@/lib/schemas";
import { requireWorkspace } from "@/lib/repolead/workspace";
import {
  getSourceModuleByIntegrationId,
  resolveSourceIntegrationIdFromLegacyType,
  resolveSourceTypeFromIntegrationId,
} from "@/lib/integrations/catalog";

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const status = request.nextUrl.searchParams.get("status")?.trim();
    const limit = parseQueryInt(request.nextUrl.searchParams.get("limit"), {
      defaultValue: 20,
      min: 1,
      max: 200,
    });
    const offset = parseQueryInt(request.nextUrl.searchParams.get("offset"), {
      defaultValue: 0,
      min: 0,
    });

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

    const integrationId = body.integration_id || resolveSourceIntegrationIdFromLegacyType(body.type) || "custom-source";
    const integrationModule = getSourceModuleByIntegrationId(integrationId);
    const sourceType = body.type || resolveSourceTypeFromIntegrationId(integrationId) || "custom_source";
    let integrationConfig = body.integration_config_json || {};

    if (integrationModule) {
      const parsedConfig = integrationModule.configSchema.safeParse(integrationConfig);
      if (!parsedConfig.success) {
        const errors = parsedConfig.error.flatten().fieldErrors;
        throw new CustomError("Invalid integration configuration", 422, errors);
      }
      integrationConfig = parsedConfig.data;
    }

    const source = await prisma.source.create({
      data: {
        workspace_id: workspaceId,
        name: body.name,
        type: sourceType,
        environment: body.environment,
        rate_limit_per_min: body.rate_limit_per_min,
        status: body.status,
        integration_id: integrationId,
        integration_config_json: integrationConfig as Prisma.InputJsonValue,
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
