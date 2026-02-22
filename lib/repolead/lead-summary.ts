import { setTimeout as delay } from "node:timers/promises";
import SendDailyLeadsSummary from "@/emails/send-daily-leads-summary";
import logger from "@/lib/logger.server";
import prisma from "@/lib/prisma";
import { delivery_status } from "@/prisma/generated/client";

type DailyLeadSummaryCronResult = {
  send_hour: number;
  checked_workspaces: number;
  sent_summaries: number;
  skipped_no_new_leads: number;
  skipped_no_recipients: number;
  failed_summaries: number;
  skipped_before_send_hour: boolean;
  skipped_smtp_not_configured: boolean;
};

const deliveryStatusOrder: delivery_status[] = ["pending", "success", "failed", "dead_letter"];

function startOfToday(baseDate: Date) {
  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);
  return start;
}

function resolveSummarySendHour() {
  const value = Number(process.env.LEAD_SUMMARY_SEND_HOUR ?? 18);
  if (!Number.isFinite(value)) {
    return 18;
  }

  return Math.min(23, Math.max(0, Math.floor(value)));
}

function resolveEmailDelayMs() {
  const value = Number(process.env.LEAD_SUMMARY_EMAIL_DELAY_MS ?? 350);
  if (!Number.isFinite(value)) {
    return 350;
  }

  return Math.max(0, Math.floor(value));
}

function isSmtpConfigured() {
  const requiredEnv = ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE"] as const;
  const hasRequired = requiredEnv.every((key) => Boolean(process.env[key]));
  if (!hasRequired) {
    return false;
  }

  const hasUsername = Boolean(process.env.SMTP_USERNAME);
  const hasPassword = Boolean(process.env.SMTP_PASSWORD);
  return hasUsername === hasPassword;
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function buildDeliveryStatusCountMap(
  rows: Array<{
    status: delivery_status;
    _count: { _all: number };
  }>,
) {
  const countMap = new Map(rows.map((row) => [row.status, row._count._all]));

  return {
    pending: countMap.get("pending") ?? 0,
    success: countMap.get("success") ?? 0,
    failed: countMap.get("failed") ?? 0,
    deadLetter: countMap.get("dead_letter") ?? 0,
    total: deliveryStatusOrder.reduce((acc, status) => acc + (countMap.get(status) ?? 0), 0),
  };
}

function getDashboardUrl(origin: string) {
  return `${origin}/dashboard`;
}

function toSummaryDateLabel(now: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(now);
}

export async function runDailyLeadSummaryCron(now = new Date()): Promise<DailyLeadSummaryCronResult> {
  const sendHour = resolveSummarySendHour();
  const emailDelayMs = resolveEmailDelayMs();
  if (now.getHours() < sendHour) {
    return {
      send_hour: sendHour,
      checked_workspaces: 0,
      sent_summaries: 0,
      skipped_no_new_leads: 0,
      skipped_no_recipients: 0,
      failed_summaries: 0,
      skipped_before_send_hour: true,
      skipped_smtp_not_configured: false,
    };
  }

  if (!isSmtpConfigured()) {
    logger.info("Daily lead summary skipped: SMTP is not configured");
    return {
      send_hour: sendHour,
      checked_workspaces: 0,
      sent_summaries: 0,
      skipped_no_new_leads: 0,
      skipped_no_recipients: 0,
      failed_summaries: 0,
      skipped_before_send_hour: false,
      skipped_smtp_not_configured: true,
    };
  }

  const todayStart = startOfToday(now);
  const appOrigin = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const dashboardUrl = getDashboardUrl(appOrigin.replace(/\/+$/, ""));
  const summaryDateLabel = toSummaryDateLabel(now);

  const workspaces = await prisma.workspace.findMany({
    where: {
      daily_lead_summary_enabled: true,
      OR: [{ last_lead_summary_sent_at: null }, { last_lead_summary_sent_at: { lt: todayStart } }],
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  let sentSummaries = 0;
  let skippedNoNewLeads = 0;
  let skippedNoRecipients = 0;
  let failedSummaries = 0;

  for (const workspace of workspaces) {
    let attemptedEmail = false;

    try {
      const [newLeadsToday, leadsTotal, ingestionsToday, deliveriesByStatus, recipientsRows] = await Promise.all([
        prisma.lead.count({
          where: {
            workspace_id: workspace.id,
            created_at: { gte: todayStart },
          },
        }),
        prisma.lead.count({
          where: { workspace_id: workspace.id },
        }),
        prisma.ingestion.count({
          where: {
            workspace_id: workspace.id,
            received_at: { gte: todayStart },
          },
        }),
        prisma.delivery.groupBy({
          by: ["status"],
          where: {
            workspace_id: workspace.id,
            created_at: { gte: todayStart },
          },
          _count: { _all: true },
        }),
        prisma.workspace_user.findMany({
          where: { workspace_id: workspace.id },
          select: {
            user: {
              select: {
                email: true,
              },
            },
          },
        }),
      ]);

      if (newLeadsToday === 0) {
        skippedNoNewLeads += 1;
        continue;
      }

      const recipients = [...new Set(recipientsRows.map((row) => row.user.email.trim().toLowerCase()).filter(Boolean))];
      if (recipients.length === 0) {
        skippedNoRecipients += 1;
        continue;
      }

      const deliveryStatusCount = buildDeliveryStatusCountMap(deliveriesByStatus);
      const deliveryErrorCount = deliveryStatusCount.failed + deliveryStatusCount.deadLetter;
      const deliverySuccessRate =
        deliveryStatusCount.total > 0 ? (deliveryStatusCount.success / deliveryStatusCount.total) * 100 : 0;

      const mail = new SendDailyLeadsSummary({
        receivers: recipients,
        workspaceName: workspace.name,
        summaryDateLabel,
        dashboardUrl,
        details: [
          { label: "Novos leads hoje", value: String(newLeadsToday) },
          { label: "Leads totais", value: String(leadsTotal) },
          { label: "Capturas hoje", value: String(ingestionsToday) },
          { label: "Entrega hoje", value: String(deliveryStatusCount.total) },
          { label: "Erros de entrega hoje", value: String(deliveryErrorCount) },
          { label: "Dead letter hoje", value: String(deliveryStatusCount.deadLetter) },
          { label: "Taxa de sucesso (entrega)", value: formatPercent(deliverySuccessRate) },
        ],
      });

      attemptedEmail = true;
      await mail.send(`Resumo diário RepoLead - ${workspace.name}`);

      await prisma.workspace.update({
        where: { id: workspace.id },
        data: {
          last_lead_summary_sent_at: now,
        },
      });

      sentSummaries += 1;
    } catch (error) {
      failedSummaries += 1;
      logger.error(`Failed to send daily lead summary for workspace ${workspace.id}`, error);
    } finally {
      if (attemptedEmail && emailDelayMs > 0) {
        await delay(emailDelayMs);
      }
    }
  }

  return {
    send_hour: sendHour,
    checked_workspaces: workspaces.length,
    sent_summaries: sentSummaries,
    skipped_no_new_leads: skippedNoNewLeads,
    skipped_no_recipients: skippedNoRecipients,
    failed_summaries: failedSummaries,
    skipped_before_send_hour: false,
    skipped_smtp_not_configured: false,
  };
}
