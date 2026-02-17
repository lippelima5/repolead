import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/client";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { parseJsonBody } from "@/lib/validation";
import { destinationTestBodySchema } from "@/lib/schemas";
import { requireWorkspace } from "@/lib/repolead/workspace";
import { dispatchDeliveryAttempt } from "@/lib/repolead/delivery";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await requireWorkspace(request, { requireAdmin: true });
    const destinationId = (await params).id;
    const body = await parseJsonBody(request, destinationTestBodySchema);

    const destination = await prisma.destination.findFirst({
      where: {
        id: destinationId,
        workspace_id: workspaceId,
      },
      select: { id: true },
    });

    if (!destination) {
      return apiError("Destination not found", 404);
    }

    const delivery = await prisma.delivery.create({
      data: {
        workspace_id: workspaceId,
        destination_id: destinationId,
        event_type: body.event_type,
        status: "pending",
        next_attempt_at: new Date(),
      },
    });

    await prisma.delivery_attempt.create({
      data: {
        delivery_id: delivery.id,
        workspace_id: workspaceId,
        attempt_number: 0,
        request_payload_json: body.payload as Prisma.InputJsonValue,
        started_at: new Date(),
        finished_at: new Date(),
      },
    });

    const result = await dispatchDeliveryAttempt(delivery.id);
    return apiSuccess(
      {
        delivery_id: delivery.id,
        result,
      },
      {
        message: "Destination test executed",
      },
    );
  } catch (error) {
    return onError(error);
  }
}
