import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError, verifyUserWorkspace } from "@/lib/helper";
import { parseJsonBody } from "@/lib/validation";
import { workspaceUpdateBodySchema } from "@/lib/schemas";

function parseId(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const parsedId = parseId((await params).id);
    if (!parsedId) {
      return apiError("Workspace id is required", 400);
    }

    await verifyUserWorkspace(request, false, parsedId);

    const workspace = await prisma.workspace.findUnique({
      where: { id: parsedId },
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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const parsedId = parseId((await params).id);
    if (!parsedId) {
      return apiError("Workspace id is required", 400);
    }

    const { name, slug, description, retention_days, idempotency_window_hours, daily_lead_summary_enabled } = await parseJsonBody(
      request,
      workspaceUpdateBodySchema,
    );

    await verifyUserWorkspace(request, true, parsedId);

    const workspace = await prisma.workspace.update({
      where: { id: parsedId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(slug !== undefined ? { slug: slug || null } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(retention_days !== undefined ? { retention_days } : {}),
        ...(idempotency_window_hours !== undefined ? { idempotency_window_hours } : {}),
        ...(daily_lead_summary_enabled !== undefined ? { daily_lead_summary_enabled } : {}),
      },
    });

    return apiSuccess(workspace, {
      message: "Workspace updated",
    });
  } catch (error) {
    return onError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const parsedId = parseId((await params).id);
    if (!parsedId) {
      return apiError("Workspace id is required", 400);
    }

    const { workspaceUser } = await verifyUserWorkspace(request, true, parsedId);
    if (workspaceUser.role !== "owner") {
      return apiError("Only owner can delete workspace", 403);
    }

    await prisma.workspace.delete({
      where: { id: parsedId },
    });

    await prisma.user.updateMany({
      where: { workspace_active_id: parsedId },
      data: { workspace_active_id: null },
    });

    return apiSuccess(null, { message: "Workspace deleted" });
  } catch (error) {
    return onError(error);
  }
}
