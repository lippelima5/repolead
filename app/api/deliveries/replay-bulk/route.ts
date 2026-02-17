import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { parseJsonBody } from "@/lib/validation";
import { deliveryReplayBulkBodySchema } from "@/lib/schemas";
import { requireWorkspace } from "@/lib/leadvault/workspace";
import { replayDeliveriesBulk } from "@/lib/leadvault/delivery";

export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace(request, { requireAdmin: true });
    const body = await parseJsonBody(request, deliveryReplayBulkBodySchema);

    const replayed = await replayDeliveriesBulk({
      workspaceId,
      status: body.status,
      destinationId: body.destination_id,
      from: body.from ? new Date(body.from) : undefined,
      to: body.to ? new Date(body.to) : undefined,
      limit: body.limit,
    });

    return apiSuccess({ replayed }, { message: "Bulk replay scheduled" });
  } catch (error) {
    return onError(error);
  }
}
