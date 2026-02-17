import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { serializeLeadsToCsv } from "@/lib/leadvault/lead-csv";
import { verifyLeadExportToken } from "@/lib/leadvault/lead-export-token";
import {
  buildLeadWhereInput,
  parseLeadFilters,
  parseLeadFiltersFromSearchParams,
} from "@/lib/leadvault/leads-query";
import { requireWorkspace } from "@/lib/leadvault/workspace";

const EXPORT_MAX_ROWS = 10_000;

function buildExportFilename() {
  const now = new Date().toISOString().replaceAll(":", "-");
  return `leadvault-leads-${now}.csv`;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")?.trim();

    const tokenPayload = token ? await verifyLeadExportToken(token) : null;
    if (token && !tokenPayload) {
      return apiError("Invalid export token", 401);
    }

    const workspaceScope =
      tokenPayload?.workspace_id ?? (await requireWorkspace(request)).workspaceId;
    const filters = tokenPayload
      ? parseLeadFilters(
          {
            query: tokenPayload.filters.query,
            status: tokenPayload.filters.status,
            sourceId: tokenPayload.filters.sourceId,
            tag: tokenPayload.filters.tag,
            limit: EXPORT_MAX_ROWS,
            offset: 0,
          },
          { defaultLimit: EXPORT_MAX_ROWS, maxLimit: EXPORT_MAX_ROWS },
        )
      : parseLeadFiltersFromSearchParams(request.nextUrl.searchParams, {
          defaultLimit: EXPORT_MAX_ROWS,
          maxLimit: EXPORT_MAX_ROWS,
        });

    const where = buildLeadWhereInput(workspaceScope, filters);

    const leads = await prisma.lead.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        tags_json: true,
        created_at: true,
        updated_at: true,
        identities: {
          select: {
            type: true,
            value: true,
          },
          orderBy: {
            created_at: "asc",
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      skip: 0,
      take: EXPORT_MAX_ROWS,
    });

    const csv = serializeLeadsToCsv(leads);

    return new Response(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${buildExportFilename()}"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return onError(error);
  }
}
