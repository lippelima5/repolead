import { NextRequest } from "next/server";
import { onError } from "@/lib/helper";
import { apiError, apiRateLimit, apiSuccess } from "@/lib/api-response";
import { hashInviteToken } from "@/lib/invite-token";
import prisma from "@/lib/prisma";
import { getRequestIp } from "@/lib/request";
import { checkRateLimit } from "@/lib/rate-limit";

function serializeInvite(invite: {
  id: number;
  workspace_id: number;
  email: string;
  role: "owner" | "admin" | "user" | "viewer";
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: Date;
  accepted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  workspace: {
    id: number;
    name: string;
    description: string | null;
  };
}) {
  return {
    id: invite.id,
    workspace_id: invite.workspace_id,
    email: invite.email,
    role: invite.role,
    status: invite.status,
    expires_at: invite.expires_at,
    accepted_at: invite.accepted_at,
    created_at: invite.created_at,
    updated_at: invite.updated_at,
    workspace: invite.workspace,
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    if (!token) {
      return apiError("Invite token is required", 400);
    }

    const ip = getRequestIp(request);
    const ipLimit = await checkRateLimit({
      namespace: "workspace:invite:get:ip",
      identifier: ip,
      limit: 60,
      windowMs: 10 * 60 * 1000,
    });

    if (ipLimit.limited) {
      return apiRateLimit("Too many invite lookups. Try again later.", ipLimit.retryAfterSeconds);
    }

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
            description: true,
          },
        },
      },
    });

    if (!invite) {
      return apiError("Invite not found", 404);
    }

    if (invite.status === "pending" && invite.expires_at < new Date()) {
      const expiredInvite = await prisma.workspace_invite.update({
        where: { id: invite.id },
        data: { status: "expired" },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      return apiSuccess(serializeInvite(expiredInvite));
    }

    return apiSuccess(serializeInvite(invite));
  } catch (error) {
    return onError(error);
  }
}


