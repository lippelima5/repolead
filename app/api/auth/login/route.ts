import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { onError, sanitizeUser } from "@/lib/helper";
import { apiError, apiRateLimit, apiSuccess } from "@/lib/api-response";
import { setAuthCookies } from "@/lib/auth-cookies";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request";
import { createAuthToken, getDefaultRedirectPath, isUserSuspended } from "@/lib/auth-session";
import { parseJsonBody } from "@/lib/validation";
import { loginBodySchema } from "@/lib/schemas";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await parseJsonBody(request, loginBodySchema);

        const ip = getRequestIp(request);
        const normalizedEmail = email;

        const ipLimit = await checkRateLimit({
            namespace: "auth:login:ip",
            identifier: ip,
            limit: 20,
            windowMs: 10 * 60 * 1000,
        });

        if (ipLimit.limited) {
            return apiRateLimit("Too many login attempts. Try again later.", ipLimit.retryAfterSeconds);
        }

        const emailLimit = await checkRateLimit({
            namespace: "auth:login:email",
            identifier: normalizedEmail,
            limit: 10,
            windowMs: 10 * 60 * 1000,
        });

        if (emailLimit.limited) {
            return apiRateLimit("Too many login attempts. Try again later.", emailLimit.retryAfterSeconds);
        }

        const user = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },     
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return apiError("Invalid credentials", 401);
        }

        if (isUserSuspended(user)) {
            return apiError("User account is suspended", 403);
        }

        const token = await createAuthToken(user);
        const safeUser = sanitizeUser(user);

        await setAuthCookies(token, safeUser);

        return apiSuccess(
            {
                user: safeUser,
                redirect_to: getDefaultRedirectPath(user.role),
            },
            { status: 200 },
        );
    } catch (error) {
        return onError(error);
    }
}


