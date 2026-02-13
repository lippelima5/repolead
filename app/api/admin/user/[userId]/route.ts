import { NextRequest } from "next/server";
import { onError, verifyUser } from "@/lib/helper";
import { apiError, apiSuccess } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/validation";
import { adminUserActionBodySchema } from "@/lib/schemas";
import prisma from "@/lib/prisma";

function parseUserId(value: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await verifyUser(request, true);

    const { userId } = await params;
    const parsedUserId = parseUserId(userId);

    if (!parsedUserId) {
      return apiError("Invalid user id", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: parsedUserId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        verified_at: true,
        suspended_at: true,
        suspended_reason: true,
        workspace_active_id: true,
        created_at: true,
        updated_at: true,
        workspaces: {
          select: {
            workspace_id: true,
            role: true,
            created_at: true,
            workspace: {
              select: {
                id: true,
                name: true,
                description: true,
                plan_status: true,
                created_at: true,
              },
            },
          },
          orderBy: {
            created_at: "desc",
          },
        },
      },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    await prisma.workspace_invite.updateMany({
      where: {
        email: user.email.toLowerCase(),
        status: "pending",
        expires_at: {
          lt: new Date(),
        },
      },
      data: {
        status: "expired",
      },
    });

    const pendingInvites = await prisma.workspace_invite.findMany({
      where: {
        email: user.email.toLowerCase(),
        status: "pending",
      },
      select: {
        id: true,
        role: true,
        status: true,
        expires_at: true,
        created_at: true,
        updated_at: true,
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
        invited_by: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return apiSuccess({
      ...user,
      pending_invites: pendingInvites,
    });
  } catch (error) {
    return onError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { user: actor } = await verifyUser(request, true);

    const { userId } = await params;
    const parsedUserId = parseUserId(userId);

    if (!parsedUserId) {
      return apiError("Invalid user id", 400);
    }

    const { action, reason } = await parseJsonBody(request, adminUserActionBodySchema);

    if (action === "suspend" && actor.id === parsedUserId) {
      return apiError("You cannot suspend your own account", 400);
    }

    const targetUser = await prisma.user.findUnique({ where: { id: parsedUserId }, select: { id: true } });

    if (!targetUser) {
      return apiError("User not found", 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parsedUserId },
      data:
        action === "suspend"
          ? {
              suspended_at: new Date(),
              suspended_reason: reason || null,
              verification_token: null,
              verification_token_expires_at: null,
            }
          : {
              suspended_at: null,
              suspended_reason: null,
            },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        suspended_at: true,
        suspended_reason: true,
        updated_at: true,
      },
    });

    return apiSuccess(updatedUser, {
      message: action === "suspend" ? "User suspended successfully" : "User reactivated successfully",
    });
  } catch (error) {
    return onError(error);
  }
}


