import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { requireWorkspace } from "@/lib/repolead/workspace";

function startOfToday() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
}

function startOfYesterday() {
  const start = startOfToday();
  start.setDate(start.getDate() - 1);
  return start;
}

function toPercentDiff(current: number, previous: number) {
  if (!previous) {
    return current ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const todayStart = startOfToday();
    const yesterdayStart = startOfYesterday();
    const now = new Date();

    const [ingestionsToday, ingestionsYesterday, leadsTotal, leadsYesterday, deliveriesToday, topSourcesRows, recentFailures] =
      await Promise.all([
        prisma.ingestion.count({
          where: {
            workspace_id: workspaceId,
            received_at: { gte: todayStart },
          },
        }),
        prisma.ingestion.count({
          where: {
            workspace_id: workspaceId,
            received_at: { gte: yesterdayStart, lt: todayStart },
          },
        }),
        prisma.lead.count({
          where: { workspace_id: workspaceId },
        }),
        prisma.lead.count({
          where: {
            workspace_id: workspaceId,
            created_at: { lt: todayStart },
          },
        }),
        prisma.delivery.groupBy({
          by: ["status"],
          where: {
            workspace_id: workspaceId,
            created_at: { gte: todayStart },
          },
          _count: { _all: true },
        }),
        prisma.ingestion.groupBy({
          by: ["source_id"],
          where: {
            workspace_id: workspaceId,
            received_at: { gte: todayStart },
          },
          _count: { _all: true },
          orderBy: { _count: { source_id: "desc" } },
          take: 5,
        }),
        prisma.delivery.findMany({
          where: {
            workspace_id: workspaceId,
            status: { in: ["failed", "dead_letter"] },
          },
          include: {
            lead: { select: { id: true, name: true, email: true } },
            destination: { select: { id: true, name: true } },
          },
          orderBy: { created_at: "desc" },
          take: 8,
        }),
      ]);

    const sourceNames = await prisma.source.findMany({
      where: {
        workspace_id: workspaceId,
        id: { in: topSourcesRows.map((row) => row.source_id) },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const sourceMap = new Map(sourceNames.map((row) => [row.id, row.name]));
    const deliveriesTotal = deliveriesToday.reduce((acc, row) => acc + row._count._all, 0);
    const successCount = deliveriesToday.find((row) => row.status === "success")?._count._all ?? 0;
    const failedCount = deliveriesToday.find((row) => row.status === "failed")?._count._all ?? 0;
    const dlqCount = deliveriesToday.find((row) => row.status === "dead_letter")?._count._all ?? 0;
    const deliveryRate = deliveriesTotal > 0 ? Number(((successCount / deliveriesTotal) * 100).toFixed(2)) : 0;

    const hourlyBase = new Map<string, number>();
    for (let index = 0; index < 24; index += 1) {
      const key = `${index.toString().padStart(2, "0")}h`;
      hourlyBase.set(key, 0);
    }

    const todayIngestions = await prisma.ingestion.findMany({
      where: {
        workspace_id: workspaceId,
        received_at: { gte: todayStart, lte: now },
      },
      select: { received_at: true },
    });

    for (const row of todayIngestions) {
      const hour = row.received_at.getHours().toString().padStart(2, "0");
      const key = `${hour}h`;
      hourlyBase.set(key, (hourlyBase.get(key) || 0) + 1);
    }

    const ingestionsChart = [...hourlyBase.entries()].map(([hour, count]) => ({ hour, count }));

    return apiSuccess({
      ingestions_today: ingestionsToday,
      ingestions_change: toPercentDiff(ingestionsToday, ingestionsYesterday),
      leads_total: leadsTotal,
      leads_change: toPercentDiff(leadsTotal, leadsYesterday),
      delivery_rate: deliveryRate,
      dlq_count: dlqCount,
      failed_count: failedCount,
      deliveries_by_status: deliveriesToday.map((item) => ({
        status: item.status,
        count: item._count._all,
      })),
      ingestions_chart: ingestionsChart,
      top_sources: topSourcesRows.map((item) => ({
        source_id: item.source_id,
        name: sourceMap.get(item.source_id) || item.source_id,
        count: item._count._all,
      })),
      recent_failures: recentFailures,
    });
  } catch (error) {
    return onError(error);
  }
}
