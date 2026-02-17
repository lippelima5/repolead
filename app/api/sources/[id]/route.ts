import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { parseJsonBody } from "@/lib/validation";
import { sourceUpdateBodySchema } from "@/lib/schemas";
import { requireWorkspace } from "@/lib/leadvault/workspace";

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

    const updated = await prisma.source.updateMany({
      where: {
        id: sourceId,
        workspace_id: workspaceId,
      },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.environment !== undefined ? { environment: body.environment } : {}),
        ...(body.rate_limit_per_min !== undefined ? { rate_limit_per_min: body.rate_limit_per_min } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
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
