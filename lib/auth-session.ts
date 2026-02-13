import { SignJWT } from "jose";
import { role, user } from "@/prisma/generated/client";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export function getDefaultRedirectPath(userRole: role) {
  return userRole === "admin" ? "/admin" : "/dashboard";
}

export function isUserSuspended(userData: Pick<user, "suspended_at">) {
  return Boolean(userData.suspended_at);
}

export async function createAuthToken(sessionUser: Pick<user, "id" | "email" | "role" | "suspended_at">) {
  return new SignJWT({
    id: sessionUser.id,
    email: sessionUser.email,
    role: sessionUser.role,
    suspended_at: sessionUser.suspended_at ? sessionUser.suspended_at.toISOString() : null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}
