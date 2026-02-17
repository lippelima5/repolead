import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { CustomError } from "@/lib/errors";
import { parseJsonBody } from "@/lib/validation";
import { sourceUpdateBodySchema } from "@/lib/schemas";
import { requireWorkspace } from "@/lib/leadvault/workspace";
import {
  getSourceModuleByIntegrationId,
  resolveSourceIntegrationIdFromLegacyType,
  resolveSourceTypeFromIntegrationId,
} from "@/lib/integrations/catalog";
import { Prisma } from "@/prisma/generated/client";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const sourceId = (await params).id;

    const source = await prisma.source.findFirst({
      where: {
        id: sourceId,
        workspace_id: workspaceId,
      },
      include: {
        api_keys: {
          where: { revoked_at: null },
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!source) {
      return apiError("Source not found", 404);
    }

    return apiSuccess(source);
  } catch (error) {
    return onError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await requireWorkspace(request, { requireAdmin: true });
    const sourceId = (await params).id;
    const body = await parseJsonBody(request, sourceUpdateBodySchema);

    const existing = await prisma.source.findFirst({
      where: {
        id: sourceId,
        workspace_id: workspaceId,
      },
    });

    if (!existing) {
      return apiError("Source not found", 404);
    }

    const integrationId =
      body.integration_id ||
      resolveSourceIntegrationIdFromLegacyType(body.type) ||
      existing.integration_id ||
      resolveSourceIntegrationIdFromLegacyType(existing.type) ||
      "custom-source";
    const integrationModule = getSourceModuleByIntegrationId(integrationId);
    const sourceType = body.type || resolveSourceTypeFromIntegrationId(integrationId) || existing.type;

    let integrationConfig = body.integration_config_json;
    if (body.integration_id && integrationConfig === undefined && body.integration_id !== existing.integration_id) {
      integrationConfig = {};
    }

    if (integrationConfig !== undefined && integrationModule) {
      const parsedConfig = integrationModule.configSchema.safeParse(integrationConfig || {});
      if (!parsedConfig.success) {
        const errors = parsedConfig.error.flatten().fieldErrors;
        throw new CustomError("Invalid integration configuration", 422, errors);
      }
      integrationConfig = parsedConfig.data;
    }

    const updated = await prisma.source.updateMany({
      where: {
        id: sourceId,
        workspace_id: workspaceId,
      },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.type === undefined ? { type: sourceType } : {}),
        ...(body.environment !== undefined ? { environment: body.environment } : {}),
        ...(body.rate_limit_per_min !== undefined ? { rate_limit_per_min: body.rate_limit_per_min } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.integration_id !== undefined || body.type !== undefined ? { integration_id: integrationId } : {}),
        ...(integrationConfig !== undefined
          ? {
              integration_config_json: integrationConfig as Prisma.InputJsonValue,
            }
          : {}),
      },
    });

    if (!updated.count) {
      return apiError("Source not found", 404);
    }

    const source = await prisma.source.findUnique({ where: { id: sourceId } });
    return apiSuccess(source, { message: "Source updated" });
  } catch (error) {
    return onError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await requireWorkspace(request, { requireAdmin: true });
    const sourceId = (await params).id;

    const deleted = await prisma.source.deleteMany({
      where: {
        id: sourceId,
        workspace_id: workspaceId,
      },
    });

    if (!deleted.count) {
      return apiError("Source not found", 404);
    }

    return apiSuccess(null, { message: "Source deleted" });
  } catch (error) {
    return onError(error);
  }
}
