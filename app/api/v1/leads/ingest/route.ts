import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/client";
import { apiError, apiRateLimit, apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { hashValue, resolveApiKeyFromHeaders } from "@/lib/leadvault/security";
import { checkSourceRateLimit } from "@/lib/leadvault/source-rate-limit";
import { enqueueIngestionProcessing, parseFormUrlEncodedBody } from "@/lib/leadvault/ingest";

const MAX_PAYLOAD_BYTES = 256 * 1024;

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

export async function POST(request: NextRequest) {
  try {
    const plainApiKey = resolveApiKeyFromHeaders(request);
    if (!plainApiKey) {
      return apiError("Missing API key", 401);
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
      return apiError("Invalid API key", 401);
    }

    const rawBody = await request.text();
    const sizeBytes = Buffer.byteLength(rawBody, "utf8");
    if (sizeBytes > MAX_PAYLOAD_BYTES) {
      return apiError("Payload too large. Maximum allowed is 256KB.", 413);
    }

    const contentType = request.headers.get("content-type");
    let parsedPayload: Record<string, unknown>;

    try {
      parsedPayload = parseRawPayload(rawBody, contentType);
    } catch {
      return apiError("Invalid payload format", 422);
    }

    const rateLimit = await checkSourceRateLimit({
      workspaceId: keyRecord.workspace_id,
      sourceId: keyRecord.source_id,
      limitPerMinute: keyRecord.source.rate_limit_per_min,
    });

    if (rateLimit.limited) {
      return apiRateLimit("Source rate limit exceeded", rateLimit.retryAfterSeconds);
    }

    const idempotencyKey = request.headers.get("idempotency-key")?.trim() || null;
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
        return apiSuccess(
          {
            ingest_id: existing.id,
            duplicate_of: existing.id,
          },
          {
            status: 202,
          },
        );
      }
    }

    const headersJson = Object.fromEntries(request.headers.entries());

    const ingestion = await prisma.ingestion.create({
      data: {
        workspace_id: keyRecord.workspace_id,
        source_id: keyRecord.source_id,
        content_type: contentType,
        raw_payload_json: parsedPayload as Prisma.InputJsonValue,
        raw_payload_text: rawBody || null,
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

    return apiSuccess(
      {
        ingest_id: ingestion.id,
      },
      {
        status: 202,
      },
    );
  } catch (error) {
    return onError(error);
  }
}
