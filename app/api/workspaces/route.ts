import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { onError, verifyUser } from "@/lib/helper";
import { parseJsonBody } from "@/lib/validation";
import { workspaceCreateBodySchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim();

    const { user } = await verifyUser(request);

    const memberships = await prisma.workspace_user.findMany({
      where: {
        user_id: user.id,
        ...(search
          ? {
              workspace: {
                OR: [{ name: { contains: search, mode: "insensitive" } }, { slug: { contains: search, mode: "insensitive" } }],
              },
            }
          : {}),
      },
      include: {
        workspace: true,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    return apiSuccess(memberships);
  } catch (error) {
    return onError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await parseJsonBody(request, workspaceCreateBodySchema);
    const { user } = await verifyUser(request);

    const workspace = await prisma.$transaction(async (tx) => {
      const created = await tx.workspace.create({
        data: {
          name,
          description: description || null,
        },
      });

      await tx.workspace_user.create({
        data: {
          workspace_id: created.id,
          user_id: user.id,
          role: "owner",
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { workspace_active_id: created.id },
      });

      return created;
    });

    return apiSuccess(workspace, {
      status: 201,
      message: "Workspace created",
    });
  } catch (error) {
    return onError(error);
  }
}
