import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError, verifyUserWorkspace } from "@/lib/helper";
import { parseJsonBody } from "@/lib/validation";
import { workspaceMemberCreateBodySchema } from "@/lib/schemas";

function parseId(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const workspaceId = parseId((await params).id);
    if (!workspaceId) {
      return apiError("Workspace id is required", 400);
    }

    await verifyUserWorkspace(request, false, workspaceId);

    const members = await prisma.workspace_user.findMany({
      where: { workspace_id: workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            created_at: true,
          },
        },
      },
      orderBy: { created_at: "asc" },
    });

    return apiSuccess(members);
  } catch (error) {
    return onError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const workspaceId = parseId((await params).id);
    if (!workspaceId) {
      return apiError("Workspace id is required", 400);
    }

    await verifyUserWorkspace(request, true, workspaceId);
    const { email, role } = await parseJsonBody(request, workspaceMemberCreateBodySchema);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, avatar: true, created_at: true },
    });

    if (!user) {
      return apiError("User not found. Use invite flow for non-existing users.", 404);
    }

    const membership = await prisma.workspace_user.upsert({
      where: {
        workspace_id_user_id: {
          workspace_id: workspaceId,
          user_id: user.id,
        },
      },
      create: {
        workspace_id: workspaceId,
        user_id: user.id,
        role,
      },
      update: {
        role,
      },
    });

    return apiSuccess(
      {
        ...membership,
        user,
      },
      {
        status: 201,
        message: "Member added",
      },
    );
  } catch (error) {
    return onError(error);
  }
}
