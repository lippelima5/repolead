import { cookies } from "next/headers";
import { SanitizedUser } from "@/types";

const isProd = process.env.NODE_ENV === "production";

function getBaseCookieOptions(expires: Date) {
  return {
    path: "/",
    sameSite: "lax" as const,
    secure: isProd,
    expires,
  };
}

export async function setAuthCookies(token: string, user: SanitizedUser) {
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await setAuthTokenCookie(token, expires);
  await setAuthUserCookie(user, expires);
}

export async function setAuthTokenCookie(token: string, expires?: Date) {
  const cookieStore = await cookies();
  const resolvedExpires = expires ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  const baseOptions = getBaseCookieOptions(resolvedExpires);

  cookieStore.set("auth.token", token, { ...baseOptions, httpOnly: true });
}

export async function setAuthUserCookie(user: SanitizedUser, expires?: Date) {
  const cookieStore = await cookies();
  const resolvedExpires = expires ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  const baseOptions = getBaseCookieOptions(resolvedExpires);

  cookieStore.set("auth.user", JSON.stringify(user), { ...baseOptions, httpOnly: false });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("auth.token");
  cookieStore.delete("auth.user");
}
