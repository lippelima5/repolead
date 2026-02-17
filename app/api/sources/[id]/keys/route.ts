import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { parseJsonBody } from "@/lib/validation";
import { sourceKeyCreateBodySchema } from "@/lib/schemas";
import { requireWorkspace } from "@/lib/leadvault/workspace";
import { createApiKey } from "@/lib/leadvault/security";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await requireWorkspace(request, { requireAdmin: true });
    const sourceId = (await params).id;
    const body = await parseJsonBody(request, sourceKeyCreateBodySchema);

    const source = await prisma.source.findFirst({
      where: {
        id: sourceId,
        workspace_id: workspaceId,
      },
      select: { id: true },
    });

    if (!source) {
      return apiError("Source not found", 404);
    }

    const key = createApiKey();

    const created = await prisma.api_key.create({
      data: {
        workspace_id: workspaceId,
        source_id: sourceId,
        name: body.name,
        hashed_key: key.hashedKey,
        prefix: key.prefix,
      },
    });

    return apiSuccess(
      {
        id: created.id,
        name: created.name,
        prefix: created.prefix,
        plain_key: key.plainKey,
        created_at: created.created_at,
      },
      {
        status: 201,
        message: "API key created (this value is shown only once)",
      },
    );
  } catch (error) {
    return onError(error);
  }
}
