import { NextRequest } from "next/server";
import SendWorkspaceInvite from "@/emails/send-workspace-invite";
import { onError, verifyUserWorkspace } from "@/lib/helper";
import { apiError, apiRateLimit, apiSuccess } from "@/lib/api-response";
import { createInviteToken } from "@/lib/invite-token";
import logger from "@/lib/logger.server";
import prisma from "@/lib/prisma";
import { getRequestIp } from "@/lib/request";
import { checkRateLimit } from "@/lib/rate-limit";
import { canInviteRole } from "@/lib/workspace-permissions";
import { parseJsonBody } from "@/lib/validation";
import { workspaceInviteCreateBodySchema } from "@/lib/schemas";

const INVITE_EXPIRATION_DAYS = 7;

function parseWorkspaceId(value: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const parsedWorkspaceId = parseWorkspaceId(workspaceId);

    if (!parsedWorkspaceId) {
      return apiError("Workspace id is required", 400);
    }

    await verifyUserWorkspace(request, false, parsedWorkspaceId);

    const workspace = await prisma.workspace.findUnique({
      where: {
        id: parsedWorkspaceId,
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      return apiError("Workspace not found", 404);
    }

    return apiSuccess(workspace.users || []);
  } catch (error) {
    return onError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const parsedWorkspaceId = parseWorkspaceId(workspaceId);

    if (!parsedWorkspaceId) {
      return apiError("Workspace id is required", 400);
    }

    const ip = getRequestIp(request);
    const ipLimit = await checkRateLimit({
      namespace: "workspace:invite:create:ip",
      identifier: ip,
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });

    if (ipLimit.limited) {
      return apiRateLimit("Too many invite attempts. Try again later.", ipLimit.retryAfterSeconds);
    }

    const { email, role } = await parseJsonBody(request, workspaceInviteCreateBodySchema);
    const normalizedRole = role ?? "user";

    const emailLimit = await checkRateLimit({
      namespace: "workspace:invite:create:email",
      identifier: `${parsedWorkspaceId}:${email}`,
      limit: 8,
      windowMs: 10 * 60 * 1000,
    });

    if (emailLimit.limited) {
      return apiRateLimit("Too many invite attempts. Try again later.", emailLimit.retryAfterSeconds);
    }

    const { user, workspaceUser } = await verifyUserWorkspace(request, true, parsedWorkspaceId);

    if (!canInviteRole(workspaceUser.role, normalizedRole)) {
      return apiError("No permission to invite this role", 403);
    }

    if (email === user.email.toLowerCase()) {
      return apiError("You cannot invite your own email", 400);
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: parsedWorkspaceId },
      select: { id: true, name: true },
    });

    if (!workspace) {
      return apiError("Workspace not found", 404);
    }

    const invitedUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (invitedUser) {
      const existingMember = await prisma.workspace_user.findUnique({
        where: {
          workspace_id_user_id: {
            workspace_id: parsedWorkspaceId,
            user_id: invitedUser.id,
          },
        },
      });

      if (existingMember) {
        return apiError("User already belongs to this workspace", 409);
      }
    }

    await prisma.workspace_invite.updateMany({
      where: {
        workspace_id: parsedWorkspaceId,
        email,
        status: "pending",
      },
      data: {
        status: "revoked",
      },
    });

    const expiresAt = new Date(Date.now() + INVITE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
    const { rawToken, tokenHash } = createInviteToken();

    const invite = await prisma.workspace_invite.create({
      data: {
        workspace_id: parsedWorkspaceId,
        email,
        role: normalizedRole,
        invited_by_id: user.id,
        token: tokenHash,
        expires_at: expiresAt,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const inviteUrl = `${appUrl}/invite/${rawToken}`;

    if (!process.env.SMTP_HOST) {
      logger.info(`SMTP is not configured. Invite URL generated for ${email}: ${inviteUrl}`);
    } else {
      try {
        const mail = new SendWorkspaceInvite({
          workspaceName: workspace.name,
          inviterName: user.name || user.email,
          inviteUrl,
          receivers: email,
        });

        await mail.sendSafe(`Invite to workspace ${workspace.name}`);
      } catch (mailError) {
        logger.error("Failed to send workspace invite email", mailError);
      }
    }

    return apiSuccess(
      {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expires_at: invite.expires_at,
      },
      {
        status: 201,
        message: "Invite created successfully",
      },
    );
  } catch (error) {
    return onError(error);
  }
}


