import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyUserWorkspace } from "@/lib/helper";
import { CustomError } from "@/lib/errors";

type RequireWorkspaceOptions = {
  requireAdmin?: boolean;
  workspaceId?: number;
};

export function parseWorkspaceIdInput(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function resolveWorkspaceIdFromRequest(request: NextRequest) {
  const headerWorkspace = parseWorkspaceIdInput(request.headers.get("x-workspace-id"));
  if (headerWorkspace) {
    return headerWorkspace;
  }

  const queryWorkspace =
    parseWorkspaceIdInput(request.nextUrl.searchParams.get("workspaceId")) ??
    parseWorkspaceIdInput(request.nextUrl.searchParams.get("workspace_id"));

  return queryWorkspace;
}

export async function requireWorkspace(request: NextRequest, options?: RequireWorkspaceOptions) {
  const explicitWorkspaceId = options?.workspaceId ?? resolveWorkspaceIdFromRequest(request) ?? undefined;
  const { user, workspaceUser } = await verifyUserWorkspace(request, options?.requireAdmin ?? false, explicitWorkspaceId);

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceUser.workspace_id },
  });

  if (!workspace) {
    throw new CustomError("Workspace not found", 404);
  }

  return {
    user,
    workspace,
    role: workspaceUser.role,
    workspaceUser,
    workspaceId: workspace.id,
  };
}
