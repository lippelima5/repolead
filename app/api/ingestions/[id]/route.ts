import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { requireWorkspace } from "@/lib/leadvault/workspace";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const ingestionId = (await params).id;

    const ingestion = await prisma.ingestion.findFirst({
      where: {
        id: ingestionId,
        workspace_id: workspaceId,
      },
      include: {
        source: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        deliveries: {
          include: {
            destination: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!ingestion) {
      return apiError("Ingestion not found", 404);
    }

    return apiSuccess(ingestion);
  } catch (error) {
    return onError(error);
  }
}
