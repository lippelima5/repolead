import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { parseJsonBody } from "@/lib/validation";
import { leadUpdateBodySchema } from "@/lib/schemas";
import { requireWorkspace } from "@/lib/leadvault/workspace";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const leadId = (await params).id;

    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        workspace_id: workspaceId,
      },
      include: {
        identities: {
          orderBy: { created_at: "asc" },
        },
      },
    });

    if (!lead) {
      return apiError("Lead not found", 404);
    }

    return apiSuccess(lead);
  } catch (error) {
    return onError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId, user } = await requireWorkspace(request);
    const leadId = (await params).id;
    const body = await parseJsonBody(request, leadUpdateBodySchema);

    const existing = await prisma.lead.findFirst({
      where: {
        id: leadId,
        workspace_id: workspaceId,
      },
    });

    if (!existing) {
      return apiError("Lead not found", 404);
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.tags !== undefined ? { tags_json: body.tags } : {}),
      },
    });

    await prisma.lead_event.create({
      data: {
        workspace_id: workspaceId,
        lead_id: leadId,
        type: "lead_updated",
        actor_type: "user",
        actor_user_id: user.id,
        old_value_json: {
          status: existing.status,
          tags_json: existing.tags_json,
        },
        new_value_json: {
          status: updated.status,
          tags_json: updated.tags_json,
        },
      },
    });

    return apiSuccess(updated, { message: "Lead updated" });
  } catch (error) {
    return onError(error);
  }
}
