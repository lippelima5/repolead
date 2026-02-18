import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { parseJsonBody } from "@/lib/validation";
import { deliverySendAllLeadsBodySchema } from "@/lib/schemas";
import { requireWorkspace } from "@/lib/repolead/workspace";
import { enqueueAllLeadsToDestination } from "@/lib/repolead/delivery";

export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace(request, { requireAdmin: true });
    const body = await parseJsonBody(request, deliverySendAllLeadsBodySchema);

    const scheduled = await enqueueAllLeadsToDestination({
      workspaceId,
      destinationId: body.destination_id,
      delayMs: body.delay_ms,
    });

    return apiSuccess({ scheduled }, { message: "Lead deliveries scheduled" });
  } catch (error) {
    return onError(error);
  }
}
