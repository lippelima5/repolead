import { NextRequest } from "next/server";
import { onError, verifyUser } from "@/lib/helper";
import { apiError, apiRateLimit, apiSuccess } from "@/lib/api-response";
import { issueUserMagicLink } from "@/lib/magic-link";
import prisma from "@/lib/prisma";
import { getRequestIp } from "@/lib/request";
import { checkRateLimit } from "@/lib/rate-limit";

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
      namespace: "admin:magic-link:ip",
      identifier: ip,
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });

    if (ipLimit.limited) {
      return apiRateLimit("Too many magic link requests. Try again later.", ipLimit.retryAfterSeconds);
    }

    const { userId } = await params;
    const parsedUserId = parseUserId(userId);

    if (!parsedUserId) {
      return apiError("Invalid user id", 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: parsedUserId },
      select: {
        id: true,
        suspended_at: true,
      },
    });

    if (!targetUser) {
      return apiError("User not found", 404);
    }

    if (targetUser.suspended_at) {
      return apiError("Cannot send magic link to a suspended user", 409);
    }

    const result = await issueUserMagicLink(targetUser.id, request.nextUrl.origin);

    return apiSuccess(result, {
      message: "Magic link sent successfully",
    });
  } catch (error) {
    return onError(error);
  }
}


