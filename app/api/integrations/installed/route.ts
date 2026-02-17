import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { requireWorkspace } from "@/lib/leadvault/workspace";

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace(request);

    const [sources, destinations] = await Promise.all([
      prisma.source.findMany({
        where: { workspace_id: workspaceId },
        select: {
          id: true,
          name: true,
          status: true,
          type: true,
          updated_at: true,
          _count: {
            select: {
              ingestions: true,
            },
          },
        },
        orderBy: { updated_at: "desc" },
      }),
      prisma.destination.findMany({
        where: { workspace_id: workspaceId },
        select: {
          id: true,
          name: true,
          enabled: true,
          updated_at: true,
          _count: {
            select: {
              deliveries: true,
            },
          },
        },
        orderBy: { updated_at: "desc" },
      }),
    ]);

    return apiSuccess({
      sources: sources.map((item) => ({
        id: item.id,
        name: item.name,
        status: item.status === "active" ? "connected" : "disabled",
        last_activity: item.updated_at,
        events_today: item._count.ingestions,
      })),
      destinations: destinations.map((item) => ({
        id: item.id,
        name: item.name,
        status: item.enabled ? "connected" : "disabled",
        last_activity: item.updated_at,
        events_today: item._count.deliveries,
      })),
    });
  } catch (error) {
    return onError(error);
  }
}
