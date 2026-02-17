import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { requireWorkspace } from "@/lib/leadvault/workspace";
import { createApiKey } from "@/lib/leadvault/security";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; keyId: string }> },
) {
  try {
    const { workspaceId } = await requireWorkspace(request, { requireAdmin: true });
    const { id: sourceId, keyId } = await params;

    const current = await prisma.api_key.findFirst({
      where: {
        id: keyId,
        source_id: sourceId,
        workspace_id: workspaceId,
      },
    });

    if (!current) {
      return apiError("API key not found", 404);
    }

    const key = createApiKey();

    const created = await prisma.$transaction(async (tx) => {
      await tx.api_key.update({
        where: { id: current.id },
        data: {
          revoked_at: new Date(),
        },
      });

      return tx.api_key.create({
        data: {
          workspace_id: workspaceId,
          source_id: sourceId,
          name: current.name,
          hashed_key: key.hashedKey,
          prefix: key.prefix,
        },
      });
    });

    return apiSuccess(
      {
        id: created.id,
        name: created.name,
        prefix: created.prefix,
        plain_key: key.plainKey,
        revoked_key_id: current.id,
      },
      {
        status: 201,
        message: "API key rotated (new value is shown only once)",
      },
    );
  } catch (error) {
    return onError(error);
  }
}
