import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { LeadStatusValue } from "@/lib/leadvault/leads-query";

const EXPORT_TOKEN_TYPE = "leads_export";
const EXPORT_TOKEN_ISSUER = "leadvault";
const EXPORT_TOKEN_AUDIENCE = "leadvault:leads-export";
const DEFAULT_EXPIRY_SECONDS = 24 * 60 * 60;

export type LeadExportFilters = {
  query?: string;
  status?: LeadStatusValue;
  sourceId?: string;
  tag?: string;
};

type LeadExportTokenPayload = JWTPayload & {
  type: typeof EXPORT_TOKEN_TYPE;
  workspace_id: number;
  user_id: number;
  email: string;
  filters: LeadExportFilters;
};

function getExportJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return new TextEncoder().encode(`${secret}:leads-export`);
}

export async function createLeadExportToken(input: {
  workspaceId: number;
  userId: number;
  email: string;
  filters: LeadExportFilters;
  expiresInSeconds?: number;
}) {
  return new SignJWT({
    type: EXPORT_TOKEN_TYPE,
    workspace_id: input.workspaceId,
    user_id: input.userId,
    email: input.email,
    filters: input.filters,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(EXPORT_TOKEN_ISSUER)
    .setAudience(EXPORT_TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(input.expiresInSeconds ?? DEFAULT_EXPIRY_SECONDS)
    .sign(getExportJwtSecret());
}

function isLeadStatusValue(value: unknown): value is LeadStatusValue {
  return (
    value === "new" ||
    value === "contacted" ||
    value === "qualified" ||
    value === "won" ||
    value === "lost" ||
    value === "needs_identity"
  );
}

function parseFilters(value: unknown): LeadExportFilters {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const raw = value as Record<string, unknown>;
  return {
    query: typeof raw.query === "string" ? raw.query : undefined,
    status: isLeadStatusValue(raw.status) ? raw.status : undefined,
    sourceId: typeof raw.sourceId === "string" ? raw.sourceId : undefined,
    tag: typeof raw.tag === "string" ? raw.tag : undefined,
  };
}

export async function verifyLeadExportToken(token: string): Promise<LeadExportTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getExportJwtSecret(), {
      issuer: EXPORT_TOKEN_ISSUER,
      audience: EXPORT_TOKEN_AUDIENCE,
    });

    const workspaceId = Number(payload.workspace_id);
    const userId = Number(payload.user_id);
    const email = typeof payload.email === "string" ? payload.email : null;
    const type = payload.type;

    if (
      type !== EXPORT_TOKEN_TYPE ||
      !Number.isInteger(workspaceId) ||
      workspaceId <= 0 ||
      !Number.isInteger(userId) ||
      userId <= 0 ||
      !email
    ) {
      return null;
    }

    return {
      ...payload,
      type,
      workspace_id: workspaceId,
      user_id: userId,
      email,
      filters: parseFilters(payload.filters),
    };
  } catch {
    return null;
  }
}
