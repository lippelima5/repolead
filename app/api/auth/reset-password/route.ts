import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { onError } from "@/lib/helper";
import { apiError, apiRateLimit, apiSuccess } from "@/lib/api-response";
import { validatePasswordPolicy } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request";
import { parseJsonBody } from "@/lib/validation";
import { resetPasswordBodySchema } from "@/lib/schemas";
import prisma from "@/lib/prisma";

function hashToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await parseJsonBody(request, resetPasswordBodySchema);

    const ip = getRequestIp(request);
    const ipLimit = await checkRateLimit({
      namespace: "auth:reset-password:ip",
      identifier: ip,
      limit: 12,
      windowMs: 60 * 60 * 1000,
    });

    if (ipLimit.limited) {
      return apiRateLimit("Too many reset password attempts. Try again later.", ipLimit.retryAfterSeconds);
    }

    const passwordError = validatePasswordPolicy(password);
    if (passwordError) {
      return apiError(passwordError, 400);
    }

    const hashedToken = hashToken(token);

    const user = await prisma.user.findFirst({
      where: {
        reset_token: hashedToken,
      },
    });

    if (!user || (user.reset_token_expires_at && user.reset_token_expires_at < new Date())) {
      return apiError("Token is invalid or Token has expired", 400);
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: await bcrypt.hash(password, 10),
        reset_token: null,
        reset_token_expires_at: null,
      },
    });

    return apiSuccess(null, {
      status: 200,
      message: "Password reset successfully",
    });
  } catch (error) {
    return onError(error);
  }
}


