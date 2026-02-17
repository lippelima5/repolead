import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { requireWorkspace } from "@/lib/leadvault/workspace";

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const limit = Math.min(200, Number(request.nextUrl.searchParams.get("limit") || 50));

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
