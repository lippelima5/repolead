import { jwtVerify, type JWTPayload } from "jose";

type UserRole = "owner" | "admin" | "user" | "viewer";

export type AuthTokenPayload = JWTPayload & {
  id: number;
  email: string;
  role: UserRole;
  suspended_at: string | null;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

function parseCookieValue(cookieHeader: string, key: string) {
  const tokenPrefix = `${key}=`;

  for (const part of cookieHeader.split(";")) {
    const value = part.trim();
    if (value.startsWith(tokenPrefix)) {
      return decodeURIComponent(value.slice(tokenPrefix.length));
    }
  }

  return null;
}

export function getAuthTokenFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  return parseCookieValue(cookieHeader, "auth.token");
}

function isRole(value: unknown): value is UserRole {
  return value === "owner" || value === "admin" || value === "user" || value === "viewer";
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    const id = Number(payload.id);
    const email = typeof payload.email === "string" ? payload.email : null;
    const payloadRole = payload.role;
    const suspendedAt = payload.suspended_at;

    if (!Number.isInteger(id) || id <= 0 || !email || !isRole(payloadRole)) {
      return null;
    }

    if (suspendedAt !== null && typeof suspendedAt !== "string" && suspendedAt !== undefined) {
      return null;
    }

    return {
      ...payload,
      id,
      email,
      role: payloadRole,
      suspended_at: typeof suspendedAt === "string" ? suspendedAt : null,
    };
  } catch {
    return null;
  }
}



