import { PrismaClientKnownRequestError } from "@/prisma/generated/internal/prismaNamespace";
import { user } from "@/prisma/generated/client";
import { SanitizedUser } from "@/types";
import { apiError } from "@/lib/api-response";
import { getAuthTokenFromRequest, verifyAuthToken } from "@/lib/auth-token";
import { CustomError } from "./errors";
import logger from "./logger.server";
import prisma from "./prisma";

export async function verifyUser(request: Request, isAdmin = false) {
  const token = getAuthTokenFromRequest(request);

  if (!token) {
    throw new CustomError("Missing authentication token", 401);
  }

  const payload = await verifyAuthToken(token);

  if (!payload) {
    throw new CustomError("Invalid authentication token", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
  });

  if (!user) {
    throw new CustomError("User not found", 401);
  }

  if (payload.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new CustomError("Invalid authentication token", 401);
  }

  if (user.suspended_at) {
    throw new CustomError("User account is suspended", 403);
  }

  if (isAdmin && user.role !== "admin") {
    throw new CustomError("Admin access required", 403);
  }

  return { user };
}

export async function verifyUserWorkspace(request: Request, isAdmin = false, workspaceId?: number) {
  const { user } = await verifyUser(request);
  const resolvedWorkspaceId = workspaceId ?? user.workspace_active_id;

  if (!resolvedWorkspaceId) {
    throw new CustomError("Workspace not selected", 400);
  }

  let workspaceUser = await prisma.workspace_user.findFirst({
    where: {
      workspace_id: resolvedWorkspaceId,
      user_id: user.id,
      ...(isAdmin && { role: { in: ["owner", "admin"] } }),
    },
  });

  if (!workspaceUser && workspaceId === undefined) {
    const fallbackMembership = await prisma.workspace_user.findFirst({
      where: {
        user_id: user.id,
        ...(isAdmin && { role: { in: ["owner", "admin"] } }),
      },
      orderBy: { created_at: "asc" },
    });

    if (fallbackMembership) {
      await prisma.user.update({
        where: { id: user.id },
        data: { workspace_active_id: fallbackMembership.workspace_id },
      });

      workspaceUser = fallbackMembership;
    }
  }

  if (!workspaceUser) {
    throw new CustomError("Workspace not found", 403);
  }

  const resolvedUser =
    user.workspace_active_id === workspaceUser.workspace_id
      ? user
      : { ...user, workspace_active_id: workspaceUser.workspace_id };

  return { user: resolvedUser, workspaceUser };
}

export function onError(error: unknown) {
  logger.error("error", error);

  if (error instanceof CustomError) {
    const details = error.details;
    const errors =
      details && typeof details === "object" ? (details as Record<string, string[]>) : undefined;
    return apiError(error.message, error.statusCode, errors);
  }

  if (typeof error === "string") {
    return apiError(error, 500);
  }

  if (error instanceof PrismaClientKnownRequestError && String(error.code) === "P2002") {
    return apiError("This value is already in use", 409);
  }

  return apiError("Internal server error", 500);
}

export function sanitizeUser(user: user): SanitizedUser {
  const safeUser = { ...user } as Partial<user>;
  delete safeUser.password;
  delete safeUser.reset_token;
  delete safeUser.reset_token_expires_at;
  delete safeUser.verification_token;
  delete safeUser.verification_token_expires_at;

  return safeUser as SanitizedUser;
}



