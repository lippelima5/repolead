import { NextRequest } from "next/server";
import { onError, verifyUserWorkspace } from "@/lib/helper";
import { apiError, apiSuccess } from "@/lib/api-response";
import prisma from "@/lib/prisma";
import { canRemoveMember } from "@/lib/workspace-permissions";

function parseId(value: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; userId: string }> },
) {
  try {
    const { workspaceId, userId } = await params;
    const parsedWorkspaceId = parseId(workspaceId);
    const parsedUserId = parseId(userId);

    if (!parsedWorkspaceId || !parsedUserId) {
      return apiError("Workspace id and user id are required", 400);
    }

    const { workspaceUser: actorWorkspaceUser } = await verifyUserWorkspace(request, true, parsedWorkspaceId);

    const targetWorkspaceUser = await prisma.workspace_user.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: parsedWorkspaceId,
          user_id: parsedUserId,
        },
      },
    });

    if (!targetWorkspaceUser) {
      return apiError("User is not in this workspace", 404);
    }

    if (targetWorkspaceUser.role === "owner") {
      return apiError("Owner cannot be removed from workspace", 403);
    }

    const isSelf = targetWorkspaceUser.user_id === actorWorkspaceUser.user_id;
    if (!canRemoveMember(actorWorkspaceUser.role, targetWorkspaceUser.role, isSelf)) {
      return apiError("No permission to remove this user", 403);
    }

    await prisma.workspace_user.deleteMany({
      where: {
        workspace_id: parsedWorkspaceId,
        user_id: parsedUserId,
      },
    });

    await prisma.user.updateMany({
      where: {
        id: parsedUserId,
        workspace_active_id: parsedWorkspaceId,
      },
      data: {
        workspace_active_id: null,
      },
    });

    return apiSuccess(null, {
      message: "User removed from workspace",
    });
  } catch (error) {
    return onError(error);
  }
}


