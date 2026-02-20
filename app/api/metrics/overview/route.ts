import { NextRequest } from "next/server";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import prisma from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { requireWorkspace } from "@/lib/repolead/workspace";

type ChartPeriod = "daily" | "monthly" | "yearly";
const METRICS_TIME_ZONE = process.env.APP_TIME_ZONE?.trim() || "America/Sao_Paulo";

function startOfMonth(date: Date) {
  const start = new Date(date);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function startOfYear(date: Date) {
  const start = new Date(date);
  start.setMonth(0, 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function resolveChartPeriod(value: string | null): ChartPeriod {
  if (value === "monthly" || value === "yearly") {
    return value;
  }

  return "daily";
}

function buildChartBase(period: ChartPeriod, now: Date) {
  const base = new Map<string, number>();

  if (period === "daily") {
    for (let index = 0; index < 24; index += 1) {
      const key = `${index.toString().padStart(2, "0")}h`;
      base.set(key, 0);
    }
    return base;
  }

  if (period === "monthly") {
    const monthLastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let index = 1; index <= monthLastDay; index += 1) {
      const key = index.toString().padStart(2, "0");
      base.set(key, 0);
    }
    return base;
  }

  for (let index = 1; index <= 12; index += 1) {
    const key = index.toString().padStart(2, "0");
    base.set(key, 0);
  }

  return base;
}

function getChartRangeStart(period: ChartPeriod, nowUtc: Date) {
  const zonedNow = toZonedTime(nowUtc, METRICS_TIME_ZONE);

  if (period === "monthly") {
    return fromZonedTime(startOfMonth(zonedNow), METRICS_TIME_ZONE);
  }

  if (period === "yearly") {
    return fromZonedTime(startOfYear(zonedNow), METRICS_TIME_ZONE);
  }

  const start = new Date(zonedNow);
  start.setHours(0, 0, 0, 0);
  return fromZonedTime(start, METRICS_TIME_ZONE);
}

function buildChartKey(dateUtc: Date, period: ChartPeriod) {
  const date = toZonedTime(dateUtc, METRICS_TIME_ZONE);

  if (period === "daily") {
    return `${date.getHours().toString().padStart(2, "0")}h`;
  }

  if (period === "monthly") {
    return date.getDate().toString().padStart(2, "0");
  }

  return (date.getMonth() + 1).toString().padStart(2, "0");
}

function getDayWindow(dayOffset: number, nowUtc: Date) {
  const startZoned = toZonedTime(nowUtc, METRICS_TIME_ZONE);
  startZoned.setHours(0, 0, 0, 0);
  startZoned.setDate(startZoned.getDate() + dayOffset);

  const endZoned = new Date(startZoned);
  endZoned.setDate(endZoned.getDate() + 1);

  return {
    startUtc: fromZonedTime(startZoned, METRICS_TIME_ZONE),
    endUtc: fromZonedTime(endZoned, METRICS_TIME_ZONE),
  };
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
    const chartPeriod = resolveChartPeriod(request.nextUrl.searchParams.get("period"));
    const nowUtc = new Date();
    const zonedNow = toZonedTime(nowUtc, METRICS_TIME_ZONE);
    const todayWindow = getDayWindow(0, nowUtc);
    const yesterdayWindow = getDayWindow(-1, nowUtc);
    const chartRangeStart = getChartRangeStart(chartPeriod, nowUtc);

    const [ingestionsToday, ingestionsYesterday, leadsTotal, leadsYesterday, deliveriesToday, topSourcesRows, recentFailures] =
      await Promise.all([
        prisma.ingestion.count({
          where: {
            workspace_id: workspaceId,
            received_at: { gte: todayWindow.startUtc },
          },
        }),
        prisma.ingestion.count({
          where: {
            workspace_id: workspaceId,
            received_at: { gte: yesterdayWindow.startUtc, lt: yesterdayWindow.endUtc },
          },
        }),
        prisma.lead.count({
          where: { workspace_id: workspaceId },
        }),
        prisma.lead.count({
          where: {
            workspace_id: workspaceId,
            created_at: { lt: todayWindow.startUtc },
          },
        }),
        prisma.delivery.groupBy({
          by: ["status"],
          where: {
            workspace_id: workspaceId,
            created_at: { gte: todayWindow.startUtc },
          },
          _count: { _all: true },
        }),
        prisma.ingestion.groupBy({
          by: ["source_id"],
          where: {
            workspace_id: workspaceId,
            received_at: { gte: todayWindow.startUtc },
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

    const chartBase = buildChartBase(chartPeriod, zonedNow);

    const periodIngestions = await prisma.ingestion.findMany({
      where: {
        workspace_id: workspaceId,
        received_at: { gte: chartRangeStart, lte: nowUtc },
      },
      select: { received_at: true },
    });

    for (const row of periodIngestions) {
      const key = buildChartKey(row.received_at, chartPeriod);
      chartBase.set(key, (chartBase.get(key) || 0) + 1);
    }

    const ingestionsChart = [...chartBase.entries()].map(([label, count]) => ({ label, count }));

    return apiSuccess({
      ingestions_today: ingestionsToday,
      ingestions_change: toPercentDiff(ingestionsToday, ingestionsYesterday),
      leads_total: leadsTotal,
      leads_change: toPercentDiff(leadsTotal, leadsYesterday),
      delivery_rate: deliveryRate,
      dlq_count: dlqCount,
      failed_count: failedCount,
      ingestions_chart_period: chartPeriod,
      metrics_timezone: METRICS_TIME_ZONE,
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
