import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { onError } from "@/lib/helper";
import { apiError, apiRateLimit, apiSuccess } from "@/lib/api-response";
import { validatePasswordPolicy } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request";
import { parseJsonBody } from "@/lib/validation";
import { registerBodySchema } from "@/lib/schemas";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await parseJsonBody(request, registerBodySchema);

    const ip = getRequestIp(request);
    const normalizedEmail = email;

    const ipLimit = await checkRateLimit({
      namespace: "auth:register:ip",
      identifier: ip,
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });

    if (ipLimit.limited) {
      return apiRateLimit("Too many register attempts. Try again later.", ipLimit.retryAfterSeconds);
    }

    const emailLimit = await checkRateLimit({
      namespace: "auth:register:email",
      identifier: normalizedEmail,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });

    if (emailLimit.limited) {
      return apiRateLimit("Too many register attempts. Try again later.", emailLimit.retryAfterSeconds);
    }

    const passwordError = validatePasswordPolicy(password);
    if (passwordError) {
      return apiError(passwordError, 400);
    }

    if (await prisma.user.findUnique({ where: { email: normalizedEmail } })) {
      return apiError("Email already exists", 409);
    }

    await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: await bcrypt.hash(password, 10),
      },
    });

    return apiSuccess(null, {
      status: 201,
      message: "User created successfully",
    });
  } catch (error) {
    return onError(error);
  }
}


