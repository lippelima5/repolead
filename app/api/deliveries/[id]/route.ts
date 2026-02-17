import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { requireWorkspace } from "@/lib/leadvault/workspace";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const deliveryId = (await params).id;

    const delivery = await prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        workspace_id: workspaceId,
      },
      include: {
        destination: true,
        lead: true,
        ingestion: true,
        attempts: {
          orderBy: { attempt_number: "desc" },
        },
      },
    });

    if (!delivery) {
      return apiError("Delivery not found", 404);
    }

    return apiSuccess(delivery);
  } catch (error) {
    return onError(error);
  }
}
