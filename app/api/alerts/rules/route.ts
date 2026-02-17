import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/client";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { parseJsonBody } from "@/lib/validation";
import { alertRuleCreateBodySchema, alertRuleUpdateBodySchema } from "@/lib/schemas";
import { requireWorkspace } from "@/lib/leadvault/workspace";

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace(request);

    const rules = await prisma.alert_rule.findMany({
      where: {
        workspace_id: workspaceId,
      },
      orderBy: { created_at: "desc" },
    });

    return apiSuccess(rules);
  } catch (error) {
    return onError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace(request, { requireAdmin: true });
    const body = await parseJsonBody(request, alertRuleCreateBodySchema);

    const rule = await prisma.alert_rule.create({
      data: {
        workspace_id: workspaceId,
        type: body.type,
        config_json: body.config_json as Prisma.InputJsonValue,
        enabled: body.enabled,
      },
    });

    return apiSuccess(rule, { status: 201, message: "Alert rule created" });
  } catch (error) {
    return onError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace(request, { requireAdmin: true });
    const ruleId = request.nextUrl.searchParams.get("ruleId")?.trim();
    if (!ruleId) {
      return apiError("ruleId is required", 400);
    }

    const body = await parseJsonBody(request, alertRuleUpdateBodySchema);
    const updated = await prisma.alert_rule.updateMany({
      where: {
        id: ruleId,
        workspace_id: workspaceId,
      },
      data: {
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.config_json !== undefined ? { config_json: body.config_json as Prisma.InputJsonValue } : {}),
        ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
      },
    });

    if (!updated.count) {
      return apiError("Alert rule not found", 404);
    }

    const rule = await prisma.alert_rule.findUnique({ where: { id: ruleId } });
    return apiSuccess(rule, { message: "Alert rule updated" });
  } catch (error) {
    return onError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace(request, { requireAdmin: true });
    const ruleId = request.nextUrl.searchParams.get("ruleId")?.trim();
    if (!ruleId) {
      return apiError("ruleId is required", 400);
    }

    const deleted = await prisma.alert_rule.deleteMany({
      where: {
        id: ruleId,
        workspace_id: workspaceId,
      },
    });

    if (!deleted.count) {
      return apiError("Alert rule not found", 404);
    }

    return apiSuccess(null, { message: "Alert rule deleted" });
  } catch (error) {
    return onError(error);
  }
}
