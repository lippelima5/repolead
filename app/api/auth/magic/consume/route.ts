import { NextRequest } from "next/server";
import { onError, sanitizeUser } from "@/lib/helper";
import { apiError, apiRateLimit, apiSuccess } from "@/lib/api-response";
import { setAuthCookies } from "@/lib/auth-cookies";
import { createAuthToken, getDefaultRedirectPath, isUserSuspended } from "@/lib/auth-session";
import { hashMagicToken } from "@/lib/magic-link";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request";
import { parseJsonBody } from "@/lib/validation";
import { consumeMagicBodySchema } from "@/lib/schemas";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { token } = await parseJsonBody(request, consumeMagicBodySchema);

    const ip = getRequestIp(request);
    const ipLimit = await checkRateLimit({
      namespace: "auth:magic:consume:ip",
      identifier: ip,
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });

    if (ipLimit.limited) {
      return apiRateLimit("Too many attempts. Try again later.", ipLimit.retryAfterSeconds);
    }

    const hashedToken = hashMagicToken(token);

    const user = await prisma.user.findFirst({
      where: {
        verification_token: hashedToken,
      },
    });

    if (!user || !user.verification_token_expires_at || user.verification_token_expires_at < new Date()) {
      return apiError("Token is invalid or expired", 400);
    }

    if (isUserSuspended(user)) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verification_token: null,
          verification_token_expires_at: null,
        },
      });

      return apiError("User account is suspended", 403);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        verified_at: user.verified_at ?? new Date(),
        verification_token: null,
        verification_token_expires_at: null,
      },
    });

    const authToken = await createAuthToken(updatedUser);
    const safeUser = sanitizeUser(updatedUser);
    await setAuthCookies(authToken, safeUser);

    return apiSuccess(
      {
        user: safeUser,
        redirect_to: getDefaultRedirectPath(updatedUser.role),
      },
      { status: 200 },
    );
  } catch (error) {
    return onError(error);
  }
}


