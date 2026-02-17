import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { parseJsonBody } from "@/lib/validation";
import { destinationUpdateBodySchema } from "@/lib/schemas";
import { requireWorkspace } from "@/lib/leadvault/workspace";
import { hashValue } from "@/lib/leadvault/security";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const destinationId = (await params).id;

    const destination = await prisma.destination.findFirst({
      where: {
        id: destinationId,
        workspace_id: workspaceId,
      },
    });

    if (!destination) {
      return apiError("Destination not found", 404);
    }

    return apiSuccess(destination);
  } catch (error) {
    return onError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await requireWorkspace(request, { requireAdmin: true });
    const destinationId = (await params).id;
    const body = await parseJsonBody(request, destinationUpdateBodySchema);

    const updated = await prisma.destination.updateMany({
      where: {
        id: destinationId,
        workspace_id: workspaceId,
      },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.url !== undefined ? { url: body.url } : {}),
        ...(body.method !== undefined ? { method: body.method } : {}),
        ...(body.headers_json !== undefined ? { headers_json: body.headers_json } : {}),
        ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
        ...(body.subscribed_events_json !== undefined ? { subscribed_events_json: body.subscribed_events_json } : {}),
        ...(body.signing_secret !== undefined
          ? {
              signing_secret_hash: body.signing_secret ? hashValue(body.signing_secret) : null,
              signing_secret_prefix: body.signing_secret ? body.signing_secret.slice(0, 12) : null,
            }
          : {}),
      },
    });

    if (!updated.count) {
      return apiError("Destination not found", 404);
    }

    const destination = await prisma.destination.findUnique({
      where: { id: destinationId },
    });

    return apiSuccess(destination, { message: "Destination updated" });
  } catch (error) {
    return onError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await requireWorkspace(request, { requireAdmin: true });
    const destinationId = (await params).id;

    const deleted = await prisma.destination.deleteMany({
      where: {
        id: destinationId,
        workspace_id: workspaceId,
      },
    });

    if (!deleted.count) {
      return apiError("Destination not found", 404);
    }

    return apiSuccess(null, { message: "Destination deleted" });
  } catch (error) {
    return onError(error);
  }
}
