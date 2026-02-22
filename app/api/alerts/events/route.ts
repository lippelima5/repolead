import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { requireWorkspace } from "@/lib/repolead/workspace";
import { parseQueryInt } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const limit = parseQueryInt(request.nextUrl.searchParams.get("limit"), {
      defaultValue: 50,
      min: 1,
      max: 200,
    });

    const events = await prisma.alert_event.findMany({
      where: {
        workspace_id: workspaceId,
      },
      include: {
        rule: true,
      },
      orderBy: { triggered_at: "desc" },
      take: limit,
    });

    return apiSuccess(events);
  } catch (error) {
    return onError(error);
  }
}
