import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError, verifyUserWorkspace } from "@/lib/helper";
import { createWorkspaceReadApiKey } from "@/lib/leadvault/read-api-key";

function parseId(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; keyId: string }> },
) {
  try {
    const { id, keyId } = await params;
    const workspaceId = parseId(id);
    if (!workspaceId) {
      return apiError("Workspace id is required", 400);
    }

    await verifyUserWorkspace(request, true, workspaceId);

    const current = await prisma.workspace_read_api_key.findFirst({
      where: {
        id: keyId,
        workspace_id: workspaceId,
      },
    });

    if (!current) {
      return apiError("Read API key not found", 404);
    }

    const key = createWorkspaceReadApiKey();

    const created = await prisma.$transaction(async (tx) => {
      await tx.workspace_read_api_key.update({
        where: { id: current.id },
        data: {
          revoked_at: new Date(),
        },
      });

      return tx.workspace_read_api_key.create({
        data: {
          workspace_id: workspaceId,
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
        message: "Read API key rotated (new value is shown only once)",
      },
    );
  } catch (error) {
    return onError(error);
  }
}
