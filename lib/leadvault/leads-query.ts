import { Prisma } from "@/prisma/generated/client";

const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost", "needs_identity"] as const;

export type LeadStatusValue = (typeof LEAD_STATUSES)[number];

export type LeadQueryFilters = {
  query?: string;
  status?: LeadStatusValue;
  sourceId?: string;
  tag?: string;
  limit: number;
  offset: number;
};

type LeadQueryInput = {
  query?: string | null;
  status?: string | null;
  source?: string | null;
  sourceId?: string | null;
  tag?: string | null;
  limit?: number | string | null;
  offset?: number | string | null;
};

type ParseLeadQueryOptions = {
  defaultLimit?: number;
  maxLimit?: number;
};

function parsePositiveInt(
  value: number | string | null | undefined,
  defaultValue: number,
  maxValue: number,
) {
  const numericValue =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;

  if (!Number.isFinite(numericValue)) {
    return defaultValue;
  }

  return Math.max(0, Math.min(maxValue, Math.trunc(numericValue)));
}

function asTrimmed(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseStatus(value: string | null | undefined): LeadStatusValue | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim() as LeadStatusValue;
  return LEAD_STATUSES.includes(normalized) ? normalized : undefined;
}

export function parseLeadFilters(
  input: LeadQueryInput,
  options?: ParseLeadQueryOptions,
): LeadQueryFilters {
  const defaultLimit = options?.defaultLimit ?? 20;
  const maxLimit = options?.maxLimit ?? 200;

  return {
    query: asTrimmed(input.query),
    status: parseStatus(input.status),
    sourceId: asTrimmed(input.sourceId) ?? asTrimmed(input.source),
    tag: asTrimmed(input.tag),
    limit: parsePositiveInt(input.limit, defaultLimit, maxLimit),
    offset: parsePositiveInt(input.offset, 0, 1_000_000),
  };
}

export function parseLeadFiltersFromSearchParams(
  searchParams: URLSearchParams,
  options?: ParseLeadQueryOptions,
): LeadQueryFilters {
  return parseLeadFilters(
    {
      query: searchParams.get("query"),
      status: searchParams.get("status"),
      source: searchParams.get("source"),
      sourceId: searchParams.get("sourceId"),
      tag: searchParams.get("tag"),
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
    },
    options,
  );
}

export function buildLeadWhereInput(
  workspaceId: number,
  filters: Pick<LeadQueryFilters, "query" | "status" | "sourceId" | "tag">,
): Prisma.leadWhereInput {
  const where: Prisma.leadWhereInput = {
    workspace_id: workspaceId,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.tag) {
    where.tags_json = {
      array_contains: [filters.tag],
    };
  }

  if (filters.sourceId) {
    where.identities = {
      some: {
        source_id: filters.sourceId,
      },
    };
  }

  if (filters.query) {
    where.OR = [
      { id: { contains: filters.query, mode: "insensitive" } },
      { name: { contains: filters.query, mode: "insensitive" } },
      { email: { contains: filters.query, mode: "insensitive" } },
      { phone: { contains: filters.query, mode: "insensitive" } },
      {
        identities: {
          some: {
            OR: [
              { value: { contains: filters.query, mode: "insensitive" } },
              { normalized_value: { contains: filters.query, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }

  return where;
}
