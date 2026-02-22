import { NextRequest } from "next/server";
import SendLeadsExport from "@/emails/send-leads-export";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import logger from "@/lib/logger.server";
import { parseJsonBody } from "@/lib/validation";
import { leadExportEmailBodySchema } from "@/lib/schemas";
import { createLeadExportToken } from "@/lib/repolead/lead-export-token";
import { parseLeadFilters } from "@/lib/repolead/leads-query";
import { requireWorkspace } from "@/lib/repolead/workspace";

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, user } = await requireWorkspace(request);
    if (!user.email) {
      return apiError("Authenticated user email is required", 400);
    }

    const body = await parseJsonBody(request, leadExportEmailBodySchema);
    const filters = parseLeadFilters(
      {
        query: body.query,
        status: body.status,
        source: body.source,
        sourceId: body.sourceId,
        tag: body.tag,
      },
      { defaultLimit: 10_000, maxLimit: 10_000 },
    );

    const token = await createLeadExportToken({
      workspaceId,
      userId: user.id,
      email: user.email,
      filters: {
        query: filters.query,
        status: filters.status,
        sourceId: filters.sourceId,
        tag: filters.tag,
      },
      expiresInSeconds: 24 * 60 * 60,
    });

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });
    const appUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const downloadUrl = `${appUrl}/api/leads/export.csv?token=${encodeURIComponent(token)}`;

    if (!process.env.SMTP_HOST) {
      logger.info(`SMTP is not configured. Leads export URL generated for ${user.email}: ${downloadUrl}`);
    } else {
      const mail = new SendLeadsExport({
        receivers: user.email,
        workspaceName: workspace?.name || "RepoLead",
        downloadUrl,
      });

      await mail.sendSafe("Exportação de leads pronta para download");
    }

    return apiSuccess(
      {
        sent_to: user.email,
        expires_in_seconds: 24 * 60 * 60,
        download_url: process.env.SMTP_HOST ? null : downloadUrl,
      },
      { message: "Export link sent to your email" },
    );
  } catch (error) {
    return onError(error);
  }
}
