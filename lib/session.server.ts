import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth-token";
import { getDefaultRedirectPath } from "@/lib/auth-session";
import { user } from "@/prisma/generated/client";

type RequireServerSessionOptions = {
  requireAdmin?: boolean;
  loginRedirectTo?: string;
};

export type ServerSessionUser = Pick<
  user,
  | "id"
  | "name"
  | "email"
  | "avatar"
  | "role"
  | "suspended_at"
  | "workspace_active_id"
  | "created_at"
  | "updated_at"
>;

export async function getServerSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth.token")?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyAuthToken(token);

  if (!payload) {
    return null;
  }

  const account = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      suspended_at: true,
      workspace_active_id: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!account || account.email.toLowerCase() !== payload.email.toLowerCase()) {
    return null;
  }

  if (account.suspended_at) {
    return null;
  }

  return account;
}

export async function requireServerSession(options?: RequireServerSessionOptions): Promise<ServerSessionUser> {
  const account = await getServerSessionUser();
  const loginRedirectTo = options?.loginRedirectTo || "/dashboard";

  if (!account) {
    redirect(`/login?redirect=${encodeURIComponent(loginRedirectTo)}`);
  }

  if (options?.requireAdmin && account.role !== "admin") {
    redirect(getDefaultRedirectPath(account.role));
  }

  return account;
}



