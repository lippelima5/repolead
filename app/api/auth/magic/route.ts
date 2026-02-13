import { NextRequest } from "next/server";
import { onError } from "@/lib/helper";
import { apiRateLimit, apiSuccess } from "@/lib/api-response";
import { issueUserMagicLink } from "@/lib/magic-link";
import prisma from "@/lib/prisma";
import { getRequestIp } from "@/lib/request";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/validation";
import { forgotPasswordBodySchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request);
    const ipLimit = await checkRateLimit({
      namespace: "auth:magic:create:ip",
      identifier: ip,
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });

    if (ipLimit.limited) {
      return apiRateLimit("Too many attempts. Try again later.", ipLimit.retryAfterSeconds);
    }

    const { email } = await parseJsonBody(request, forgotPasswordBodySchema);

    const emailLimit = await checkRateLimit({
      namespace: "auth:magic:create:email",
      identifier: email,
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });

    if (emailLimit.limited) {
      return apiRateLimit("Too many attempts. Try again later.", emailLimit.retryAfterSeconds);
    }

    const account = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        suspended_at: true,
      },
    });

    if (account && !account.suspended_at) {
      await issueUserMagicLink(account.id, request.nextUrl.origin);
    }

    return apiSuccess(null, {
      message: "If the account exists, a magic link has been sent.",
    });
  } catch (error) {
    return onError(error);
  }
}



