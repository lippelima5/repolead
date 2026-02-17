import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError, verifyUserWorkspace } from "@/lib/helper";
import { parseJsonBody } from "@/lib/validation";
import { workspaceMemberUpdateBodySchema } from "@/lib/schemas";

function parseId(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  try {
    const { id, memberId } = await params;
    const workspaceId = parseId(id);
    const userId = parseId(memberId);

    if (!workspaceId || !userId) {
      return apiError("Workspace id and member id are required", 400);
    }

    await verifyUserWorkspace(request, true, workspaceId);
    const { role } = await parseJsonBody(request, workspaceMemberUpdateBodySchema);

    const membership = await prisma.workspace_user.update({
      where: {
        workspace_id_user_id: {
          workspace_id: workspaceId,
          user_id: userId,
        },
      },
      data: { role },
    });

    return apiSuccess(membership, { message: "Member updated" });
  } catch (error) {
    return onError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  try {
    const { id, memberId } = await params;
    const workspaceId = parseId(id);
    const userId = parseId(memberId);

    if (!workspaceId || !userId) {
      return apiError("Workspace id and member id are required", 400);
    }

    const { workspaceUser } = await verifyUserWorkspace(request, true, workspaceId);
    const targetMembership = await prisma.workspace_user.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: workspaceId,
          user_id: userId,
        },
      },
    });

    if (!targetMembership) {
      return apiError("Member not found", 404);
    }

    if (targetMembership.role === "owner") {
      return apiError("Owner cannot be removed", 403);
    }

    if (workspaceUser.user_id === userId) {
      return apiError("You cannot remove yourself", 400);
    }

    await prisma.workspace_user.delete({
      where: {
        workspace_id_user_id: {
          workspace_id: workspaceId,
          user_id: userId,
        },
      },
    });

    await prisma.user.updateMany({
      where: {
        id: userId,
        workspace_active_id: workspaceId,
      },
      data: {
        workspace_active_id: null,
      },
    });

    return apiSuccess(null, { message: "Member removed" });
  } catch (error) {
    return onError(error);
  }
}
