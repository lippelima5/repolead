import { NextRequest } from "next/server";
import { onError, sanitizeUser, verifyUser } from "@/lib/helper";
import { apiSuccess } from "@/lib/api-response";
import { setAuthUserCookie } from "@/lib/auth-cookies";
import { parseJsonBody } from "@/lib/validation";
import { workspaceCreateBodySchema } from "@/lib/schemas";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim();

    const { user } = await verifyUser(request);

    const userWorkspaces = await prisma.workspace_user.findMany({
      where: {
        user_id: user.id,
        ...(search
          ? {
              workspace: {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { description: { contains: search, mode: "insensitive" } },
                ],
              },
            }
          : {}),
      },
      include: {
        workspace: true,
      },
    });

    return apiSuccess(userWorkspaces);
  } catch (error) {
    return onError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await parseJsonBody(request, workspaceCreateBodySchema);

    const { user } = await verifyUser(request);

    const result = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name,
          description: description || null,
        },
      });

      await tx.workspace_user.create({
        data: {
          workspace_id: workspace.id,
          user_id: user.id,
          role: "owner",
        },
      });

      const updatedUser = await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          workspace_active_id: workspace.id,
        },
      });

      return { workspace, updatedUser };
    });

    await setAuthUserCookie(sanitizeUser(result.updatedUser));

    return apiSuccess(result.workspace, {
      status: 201,
      message: "Workspace created successfully",
    });
  } catch (error) {
    return onError(error);
  }
}


