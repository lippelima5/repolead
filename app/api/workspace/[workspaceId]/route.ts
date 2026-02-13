import { NextRequest } from "next/server";
import { onError, verifyUserWorkspace } from "@/lib/helper";
import { apiError, apiSuccess } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/validation";
import { workspaceUpdateBodySchema } from "@/lib/schemas";
import prisma from "@/lib/prisma";

function parseWorkspaceId(value: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const parsedWorkspaceId = parseWorkspaceId(workspaceId);

    if (!parsedWorkspaceId) {
      return apiError("Workspace id is required", 400);
    }

    await verifyUserWorkspace(request, false, parsedWorkspaceId);

    const workspace = await prisma.workspace.findUnique({
      where: {
        id: parsedWorkspaceId,
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      return apiError("Workspace not found", 404);
    }

    return apiSuccess(workspace);
  } catch (error) {
    return onError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const parsedWorkspaceId = parseWorkspaceId(workspaceId);

    if (!parsedWorkspaceId) {
      return apiError("Workspace id is required", 400);
    }

    const { name, description } = await parseJsonBody(request, workspaceUpdateBodySchema);

    await verifyUserWorkspace(request, true, parsedWorkspaceId);

    const workspace = await prisma.workspace.update({
      where: {
        id: parsedWorkspaceId,
      },
      data: {
        name,
        description: description || null,
      },
    });

    return apiSuccess(workspace, {
      message: "Workspace updated successfully",
    });
  } catch (error) {
    return onError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const parsedWorkspaceId = parseWorkspaceId(workspaceId);

    if (!parsedWorkspaceId) {
      return apiError("Workspace id is required", 400);
    }

    const { workspaceUser } = await verifyUserWorkspace(request, true, parsedWorkspaceId);

    if (workspaceUser.role !== "owner") {
      return apiError("Only owner can delete workspace", 403);
    }

    await prisma.workspace.delete({
      where: {
        id: workspaceUser.workspace_id,
      },
    });

    await prisma.user.updateMany({
      where: {
        workspace_active_id: parsedWorkspaceId,
      },
      data: {
        workspace_active_id: null,
      },
    });

    return apiSuccess(null, {
      message: "Workspace deleted successfully",
    });
  } catch (error) {
    return onError(error);
  }
}


