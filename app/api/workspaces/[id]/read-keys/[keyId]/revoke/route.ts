import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError, verifyUserWorkspace } from "@/lib/helper";

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

    const updated = await prisma.workspace_read_api_key.updateMany({
      where: {
        id: keyId,
        workspace_id: workspaceId,
        revoked_at: null,
      },
      data: {
        revoked_at: new Date(),
      },
    });

    if (!updated.count) {
      return apiError("Read API key not found", 404);
    }

    return apiSuccess(null, { message: "Read API key revoked" });
  } catch (error) {
    return onError(error);
  }
}
