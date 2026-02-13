import { NextRequest } from "next/server";
import SendWorkspaceInvite from "@/emails/send-workspace-invite";
import { onError, verifyUser } from "@/lib/helper";
import { apiError, apiRateLimit, apiSuccess } from "@/lib/api-response";
import { createInviteToken } from "@/lib/invite-token";
import logger from "@/lib/logger.server";
import prisma from "@/lib/prisma";
import { getRequestIp } from "@/lib/request";
import { checkRateLimit } from "@/lib/rate-limit";

const INVITE_EXPIRATION_DAYS = 7;

function parseUserId(value: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await verifyUser(request, true);

    const ip = getRequestIp(request);
    const ipLimit = await checkRateLimit({
      namespace: "admin:invite:resend:ip",
      identifier: ip,
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });

    if (ipLimit.limited) {
      return apiRateLimit("Too many invite resend attempts. Try again later.", ipLimit.retryAfterSeconds);
    }

    const { userId } = await params;
    const parsedUserId = parseUserId(userId);

    if (!parsedUserId) {
      return apiError("Invalid user id", 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: parsedUserId },
      select: {
        email: true,
      },
    });

    if (!targetUser) {
      return apiError("User not found", 404);
    }

    await prisma.workspace_invite.updateMany({
      where: {
        email: targetUser.email.toLowerCase(),
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
        email: targetUser.email.toLowerCase(),
        status: "pending",
      },
      include: {
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

    if (pendingInvites.length === 0) {
      return apiError("No pending invites available for this user", 404);
    }

    const appUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    let sentCount = 0;

    for (const invite of pendingInvites) {
      const { rawToken, tokenHash } = createInviteToken();

      await prisma.$transaction([
        prisma.workspace_invite.update({
          where: { id: invite.id },
          data: { status: "revoked" },
        }),
        prisma.workspace_invite.create({
          data: {
            workspace_id: invite.workspace_id,
            email: invite.email,
            role: invite.role,
            invited_by_id: invite.invited_by_id,
            token: tokenHash,
            status: "pending",
            expires_at: new Date(Date.now() + INVITE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000),
          },
        }),
      ]);

      const inviteUrl = `${appUrl}/invite/${rawToken}`;
      if (!process.env.SMTP_HOST) {
        logger.info(`SMTP is not configured. Invite URL generated for ${invite.email}: ${inviteUrl}`);
      } else {
        const mail = new SendWorkspaceInvite({
          workspaceName: invite.workspace.name,
          inviterName: invite.invited_by.name || invite.invited_by.email,
          inviteUrl,
          receivers: invite.email,
        });

        await mail.sendSafe(`Invite to workspace ${invite.workspace.name}`);
      }
      sentCount += 1;
    }

    return apiSuccess(
      {
        invites_sent: sentCount,
      },
      {
        message: "Workspace invites resent successfully",
      },
    );
  } catch (error) {
    return onError(error);
  }
}


