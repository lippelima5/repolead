import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { requireWorkspace } from "@/lib/leadvault/workspace";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; keyId: string }> },
) {
  try {
    const { workspaceId } = await requireWorkspace(request, { requireAdmin: true });
    const { id: sourceId, keyId } = await params;

    const updated = await prisma.api_key.updateMany({
      where: {
        id: keyId,
        source_id: sourceId,
        workspace_id: workspaceId,
        revoked_at: null,
      },
      data: {
        revoked_at: new Date(),
      },
    });

    if (!updated.count) {
      return apiError("API key not found", 404);
    }

    return apiSuccess(null, { message: "API key revoked" });
  } catch (error) {
    return onError(error);
  }
}
