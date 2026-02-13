import { NextRequest } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import SendReedemPassword from "@/emails/send-reedem-password";
import { onError } from "@/lib/helper";
import { apiRateLimit, apiSuccess } from "@/lib/api-response";
import { getAppBaseUrl } from "@/lib/app-url";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request";
import { parseJsonBody } from "@/lib/validation";
import { forgotPasswordBodySchema } from "@/lib/schemas";
import prisma from "@/lib/prisma";

function hashToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await parseJsonBody(request, forgotPasswordBodySchema);

    const normalizedEmail = email;
    const ip = getRequestIp(request);

    const ipLimit = await checkRateLimit({
      namespace: "auth:forgot-password:ip",
      identifier: ip,
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });

    if (ipLimit.limited) {
      return apiRateLimit("Too many forgot password requests. Try again later.", ipLimit.retryAfterSeconds);
    }

    const emailLimit = await checkRateLimit({
      namespace: "auth:forgot-password:email",
      identifier: normalizedEmail,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });

    if (emailLimit.limited) {
      return apiRateLimit("Too many forgot password requests. Try again later.", emailLimit.retryAfterSeconds);
    }

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (user) {
      const rawToken = randomBytes(32).toString("hex");
      const hashedToken = hashToken(rawToken);

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          reset_token: hashedToken,
          reset_token_expires_at: new Date(Date.now() + 3600000), // 1 hour
        },
      });

      const baseUrl = getAppBaseUrl(request.nextUrl.origin);
      const url = `${baseUrl}/reset-password?email=${user.email}&token=${rawToken}`;

      const mail = new SendReedemPassword(user.name || "", url, user.email);
      await mail.sendSafe("Redefinir Senha");
    }

    return apiSuccess(null, {
      status: 200,
      message: "Email sent successfully",
    });
  } catch (error) {
    return onError(error);
  }
}


