import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { requireWorkspace } from "@/lib/leadvault/workspace";
import { replayDelivery } from "@/lib/leadvault/delivery";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await requireWorkspace(request, { requireAdmin: true });
    const deliveryId = (await params).id;

    const ok = await replayDelivery(deliveryId, workspaceId);
    if (!ok) {
      return apiError("Delivery not found", 404);
    }

    return apiSuccess({ id: deliveryId }, { message: "Replay scheduled" });
  } catch (error) {
    return onError(error);
  }
}
