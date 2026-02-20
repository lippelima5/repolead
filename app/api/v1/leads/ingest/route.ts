import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/client";
import { apiError, apiRateLimit, apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { hashValue, resolveApiKeyFromHeaders } from "@/lib/repolead/security";
import { checkSourceRateLimit } from "@/lib/repolead/source-rate-limit";
import { enqueueIngestionProcessing, parseFormUrlEncodedBody } from "@/lib/repolead/ingest";

const MAX_PAYLOAD_BYTES = 256 * 1024;
const CORS_ALLOW_HEADERS = "Authorization, Content-Type, Idempotency-Key, X-Api-Key";
const RESERVED_PAYLOAD_KEYS = ["api_key", "apiKey", "source_key", "sourceKey", "idempotency_key", "idempotencyKey"];

function withCors<T>(response: NextResponse<T>) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", CORS_ALLOW_HEADERS);
  response.headers.set("Access-Control-Expose-Headers", "Retry-After");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

function getPayloadStringField(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function sanitizePayload(payload: Record<string, unknown>) {
  const sanitized: Record<string, unknown> = { ...payload };

  for (const key of RESERVED_PAYLOAD_KEYS) {
    delete sanitized[key];
  }

  return sanitized;
}

function serializePayloadAsUrlEncoded(payload: Record<string, unknown>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) {
          continue;
        }

        searchParams.append(key, typeof item === "string" ? item : String(item));
      }
      continue;
    }

    searchParams.append(key, typeof value === "string" ? value : String(value));
  }

  const serialized = searchParams.toString();
  return serialized.length > 0 ? serialized : null;
}

function sanitizeRawBody(rawBody: string, contentType: string | null, payload: Record<string, unknown>) {
  if (!rawBody) {
    return null;
  }

  if (contentType?.includes("application/json")) {
    return JSON.stringify(payload);
  }

  if (contentType?.includes("application/x-www-form-urlencoded")) {
    return serializePayloadAsUrlEncoded(payload);
  }

  return rawBody;
}

function parseRawPayload(rawBody: string, contentType: string | null) {
  if (!rawBody) {
    return {};
  }

  if (contentType?.includes("application/json")) {
    return JSON.parse(rawBody) as Record<string, unknown>;
  }

  if (contentType?.includes("application/x-www-form-urlencoded")) {
    return parseFormUrlEncodedBody(rawBody);
  }

  return { raw: rawBody };
}

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const sizeBytes = Buffer.byteLength(rawBody, "utf8");
    if (sizeBytes > MAX_PAYLOAD_BYTES) {
      return withCors(apiError("Payload too large. Maximum allowed is 256KB.", 413));
    }

    const contentType = request.headers.get("content-type");
    let parsedPayload: Record<string, unknown>;

    try {
      parsedPayload = parseRawPayload(rawBody, contentType);
    } catch {
      return withCors(apiError("Invalid payload format", 422));
    }

    const plainApiKey =
      resolveApiKeyFromHeaders(request) ||
      getPayloadStringField(parsedPayload, ["api_key", "apiKey", "source_key", "sourceKey"]) ||
      request.nextUrl.searchParams.get("api_key")?.trim() ||
      null;

    if (!plainApiKey) {
      return withCors(apiError("Missing API key", 401));
    }

    const hashedApiKey = hashValue(plainApiKey);
    const keyRecord = await prisma.api_key.findFirst({
      where: {
        hashed_key: hashedApiKey,
        revoked_at: null,
      },
      include: {
        source: true,
      },
    });

    if (!keyRecord || keyRecord.source.status !== "active") {
      return withCors(apiError("Invalid API key", 401));
    }

    const rateLimit = await checkSourceRateLimit({
      workspaceId: keyRecord.workspace_id,
      sourceId: keyRecord.source_id,
      limitPerMinute: keyRecord.source.rate_limit_per_min,
    });

    if (rateLimit.limited) {
      return withCors(apiRateLimit("Source rate limit exceeded", rateLimit.retryAfterSeconds));
    }

    const idempotencyKey =
      request.headers.get("idempotency-key")?.trim() ||
      getPayloadStringField(parsedPayload, ["idempotency_key", "idempotencyKey"]) ||
      null;

    if (idempotencyKey) {
      const existing = await prisma.ingestion.findFirst({
        where: {
          workspace_id: keyRecord.workspace_id,
          source_id: keyRecord.source_id,
          idempotency_key: idempotencyKey,
        },
        select: {
          id: true,
        },
      });

      if (existing) {
        return withCors(apiSuccess(
          {
            ingest_id: existing.id,
            duplicate_of: existing.id,
          },
          {
            status: 202,
          },
        ));
      }
    }

    const sanitizedPayload = sanitizePayload(parsedPayload);
    const sanitizedRawBody = sanitizeRawBody(rawBody, contentType, sanitizedPayload);
    const headersJson = Object.fromEntries(request.headers.entries());

    const ingestion = await prisma.ingestion.create({
      data: {
        workspace_id: keyRecord.workspace_id,
        source_id: keyRecord.source_id,
        content_type: contentType,
        raw_payload_json: sanitizedPayload as Prisma.InputJsonValue,
        raw_payload_text: sanitizedRawBody,
        headers_json: headersJson as Prisma.InputJsonValue,
        idempotency_key: idempotencyKey,
        size_bytes: sizeBytes,
        status: "pending",
      },
    });

    await prisma.api_key.update({
      where: { id: keyRecord.id },
      data: {
        last_used_at: new Date(),
      },
    });

    enqueueIngestionProcessing(ingestion.id);

    return withCors(apiSuccess(
      {
        ingest_id: ingestion.id,
      },
      {
        status: 202,
      },
    ));
  } catch (error) {
    return withCors(onError(error));
  }
}
