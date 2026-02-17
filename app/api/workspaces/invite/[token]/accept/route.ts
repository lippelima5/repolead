import { NextRequest } from "next/server";
import { onError, sanitizeUser, verifyUser } from "@/lib/helper";
import { apiError, apiRateLimit, apiSuccess } from "@/lib/api-response";
import { setAuthUserCookie } from "@/lib/auth-cookies";
import { hashInviteToken } from "@/lib/invite-token";
import prisma from "@/lib/prisma";
import { getRequestIp } from "@/lib/request";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    if (!token) {
      return apiError("Invite token is required", 400);
    }

    const ip = getRequestIp(request);
    const ipLimit = await checkRateLimit({
      namespace: "workspace:invite:accept:ip",
      identifier: ip,
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });

    if (ipLimit.limited) {
      return apiRateLimit("Too many invite accept attempts. Try again later.", ipLimit.retryAfterSeconds);
    }

    const { user } = await verifyUser(request);

    const tokenHash = hashInviteToken(token);

    const invite = await prisma.workspace_invite.findFirst({
      where: {
        OR: [{ token: tokenHash }, { token }],
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invite) {
      return apiError("Invite not found", 404);
    }

    if (invite.status !== "pending") {
      return apiError("Invite is not pending", 409);
    }

    if (invite.expires_at < new Date()) {
      await prisma.workspace_invite.update({ where: { id: invite.id }, data: { status: "expired" } });
      return apiError("Invite has expired", 410);
    }

    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return apiError("This invite belongs to another email", 403);
    }

    const [workspaceUser, updatedUser, acceptedInvite] = await prisma.$transaction([
      prisma.workspace_user.upsert({
        where: {
          workspace_id_user_id: {
            workspace_id: invite.workspace_id,
            user_id: user.id,
          },
        },
        create: {
          workspace_id: invite.workspace_id,
          user_id: user.id,
          role: invite.role,
        },
        update: {},
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { workspace_active_id: invite.workspace_id },
      }),
      prisma.workspace_invite.update({
        where: { id: invite.id },
        data: {
          status: "accepted",
          accepted_at: new Date(),
          accepted_by_id: user.id,
        },
      }),
    ]);

    await setAuthUserCookie(sanitizeUser(updatedUser));

    return apiSuccess(
      {
        workspace_id: workspaceUser.workspace_id,
        invite_id: acceptedInvite.id,
      },
      {
        message: "Invite accepted successfully",
      },
    );
  } catch (error) {
    return onError(error);
  }
}
