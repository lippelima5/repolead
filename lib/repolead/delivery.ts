import prisma from "@/lib/prisma";
import { createWebhookSignature } from "@/lib/repolead/security";
import { Prisma, delivery, destination } from "@/prisma/generated/client";

const MAX_DELIVERY_ATTEMPTS = 50;
const DELIVERY_TIMEOUT_MS = 10000;

type PrismaClientLike = typeof prisma | Prisma.TransactionClient;

type EnqueueDeliveriesParams = {
  workspaceId: number;
  leadId?: string | null;
  ingestId?: string | null;
  eventType: string;
  tx?: PrismaClientLike;
};

function getJsonRecord(value: Prisma.JsonValue | null | undefined): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const entries = Object.entries(value as Record<string, unknown>).filter(([, item]) => typeof item === "string");
  return Object.fromEntries(entries) as Record<string, string>;
}

function getSubscribedEvents(value: Prisma.JsonValue | null | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function supportsEvent(destinationItem: destination, eventType: string) {
  const subscribed = getSubscribedEvents(destinationItem.subscribed_events_json);
  if (subscribed.length === 0) {
    return true;
  }

  return subscribed.includes(eventType);
}

function nextAttemptDate(attemptNumber: number) {
  const baseMs = Math.min(60 * 60 * 1000, Math.pow(2, Math.min(attemptNumber, 12)) * 1000);
  const jitterMs = Math.floor(Math.random() * 3000);
  return new Date(Date.now() + baseMs + jitterMs);
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function buildPayload(deliveryItem: delivery) {
  const [leadItem, ingestionItem] = await Promise.all([
    deliveryItem.lead_id
      ? prisma.lead.findUnique({
          where: { id: deliveryItem.lead_id },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            tags_json: true,
            created_at: true,
            updated_at: true,
          },
        })
      : Promise.resolve(null),
    deliveryItem.ingest_id
      ? prisma.ingestion.findUnique({
          where: { id: deliveryItem.ingest_id },
          select: {
            id: true,
            source_id: true,
            status: true,
            raw_payload_json: true,
            received_at: true,
          },
        })
      : Promise.resolve(null),
  ]);

  return {
    delivery_id: deliveryItem.id,
    event_type: deliveryItem.event_type,
    workspace_id: deliveryItem.workspace_id,
    lead: leadItem,
    ingestion: ingestionItem,
  };
}

async function createAttemptResult(
  deliveryItem: delivery,
  destinationItem: destination,
  payload: Record<string, unknown>,
  attemptNumber: number,
) {
  const startedAt = new Date();
  const bodyText = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = destinationItem.signing_secret_hash
    ? createWebhookSignature(destinationItem.signing_secret_hash, timestamp, bodyText)
    : null;

  const customHeaders = getJsonRecord(destinationItem.headers_json);
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...customHeaders,
    "x-repolead-timestamp": timestamp,
    "x-repolead-event": deliveryItem.event_type,
    "x-repolead-delivery-id": deliveryItem.id,
  };

  if (signature) {
    headers["x-repolead-signature"] = signature;
  }

  let responseStatus: number | null = null;
  let responseBody = "";
  let failedMessage: string | null = null;

  try {
    const response = await fetchWithTimeout(
      destinationItem.url,
      {
        method: destinationItem.method.toUpperCase(),
        headers,
        body: bodyText,
      },
      DELIVERY_TIMEOUT_MS,
    );

    responseStatus = response.status;
    responseBody = (await response.text()).slice(0, 5000);

    if (!response.ok) {
      failedMessage = `HTTP ${response.status}`;
    }
  } catch (error) {
    failedMessage = error instanceof Error ? error.message : "Unknown delivery error";
  }

  const finishedAt = new Date();

  await prisma.delivery_attempt.create({
    data: {
      delivery_id: deliveryItem.id,
      workspace_id: deliveryItem.workspace_id,
      attempt_number: attemptNumber,
      request_payload_json: payload as Prisma.InputJsonValue,
      response_status: responseStatus ?? undefined,
      response_body_text: responseBody || undefined,
      error: failedMessage ?? undefined,
      started_at: startedAt,
      finished_at: finishedAt,
    },
  });

  return {
    failedMessage,
    responseStatus,
    finishedAt,
  };
}

export async function enqueueDeliveries(params: EnqueueDeliveriesParams) {
  const tx = params.tx ?? prisma;
  const destinations = await tx.destination.findMany({
    where: {
      workspace_id: params.workspaceId,
      enabled: true,
    },
  });

  const destinationIds = destinations.filter((item) => supportsEvent(item, params.eventType)).map((item) => item.id);
  if (destinationIds.length === 0) {
    return [];
  }

  const created: delivery[] = [];

  for (const destinationId of destinationIds) {
    const row = await tx.delivery.create({
      data: {
        workspace_id: params.workspaceId,
        destination_id: destinationId,
        lead_id: params.leadId ?? null,
        ingest_id: params.ingestId ?? null,
        event_type: params.eventType,
        status: "pending",
        next_attempt_at: new Date(),
      },
    });
    created.push(row);
  }

  return created;
}

export async function dispatchDeliveryAttempt(deliveryId: string) {
  const deliveryItem = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      destination: true,
    },
  });

  if (!deliveryItem || !deliveryItem.destination.enabled) {
    return null;
  }

  const attemptNumber = deliveryItem.attempt_count + 1;
  const payload = await buildPayload(deliveryItem);
  const attempt = await createAttemptResult(deliveryItem, deliveryItem.destination, payload, attemptNumber);

  if (!attempt.failedMessage) {
    await prisma.delivery.update({
      where: { id: deliveryItem.id },
      data: {
        status: "success",
        attempt_count: attemptNumber,
        last_attempt_at: attempt.finishedAt,
        next_attempt_at: null,
        last_error: null,
      },
    });

    if (deliveryItem.lead_id) {
      await prisma.lead_event.create({
        data: {
          workspace_id: deliveryItem.workspace_id,
          lead_id: deliveryItem.lead_id,
          type: "delivered",
          delivery_id: deliveryItem.id,
          actor_type: "system",
          reason: attempt.responseStatus ? `HTTP ${attempt.responseStatus}` : "Delivered",
        },
      });
    }

    return { success: true };
  }

  const isDeadLetter = attemptNumber >= MAX_DELIVERY_ATTEMPTS;
  const nextAttempt = isDeadLetter ? null : nextAttemptDate(attemptNumber);

  await prisma.delivery.update({
    where: { id: deliveryItem.id },
    data: {
      status: isDeadLetter ? "dead_letter" : "failed",
      attempt_count: attemptNumber,
      last_attempt_at: attempt.finishedAt,
      next_attempt_at: nextAttempt,
      last_error: attempt.failedMessage,
    },
  });

  if (deliveryItem.lead_id) {
    await prisma.lead_event.create({
      data: {
        workspace_id: deliveryItem.workspace_id,
        lead_id: deliveryItem.lead_id,
        type: "delivery_failed",
        delivery_id: deliveryItem.id,
        actor_type: "system",
        reason: attempt.failedMessage,
      },
    });
  }

  return {
    success: false,
    deadLetter: isDeadLetter,
    error: attempt.failedMessage,
  };
}

export async function runDeliveryCron(limit = 50) {
  const dueDeliveries = await prisma.delivery.findMany({
    where: {
      AND: [
        {
          status: {
            in: ["pending", "failed"],
          },
        },
        {
          OR: [{ next_attempt_at: null }, { next_attempt_at: { lte: new Date() } }],
        },
      ],
    },
    orderBy: [{ next_attempt_at: "asc" }, { created_at: "asc" }],
    take: limit,
  });

  const results: Array<{ deliveryId: string; success: boolean }> = [];
  for (const item of dueDeliveries) {
    const result = await dispatchDeliveryAttempt(item.id);
    results.push({ deliveryId: item.id, success: Boolean(result?.success) });
  }

  return {
    processed: dueDeliveries.length,
    results,
  };
}

export async function replayDelivery(deliveryId: string, workspaceId: number) {
  const updated = await prisma.delivery.updateMany({
    where: {
      id: deliveryId,
      workspace_id: workspaceId,
    },
    data: {
      status: "pending",
      next_attempt_at: new Date(),
      last_error: null,
    },
  });

  return updated.count > 0;
}

type ReplayBulkFilters = {
  workspaceId: number;
  status?: "pending" | "success" | "failed" | "dead_letter";
  destinationId?: string;
  from?: Date;
  to?: Date;
  limit: number;
};

export async function replayDeliveriesBulk(filters: ReplayBulkFilters) {
  const rows = await prisma.delivery.findMany({
    where: {
      workspace_id: filters.workspaceId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.destinationId ? { destination_id: filters.destinationId } : {}),
      ...(filters.from || filters.to
        ? {
            created_at: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    },
    select: { id: true },
    take: filters.limit,
    orderBy: { created_at: "desc" },
  });

  if (rows.length === 0) {
    return 0;
  }

  const ids = rows.map((item) => item.id);
  const updateResult = await prisma.delivery.updateMany({
    where: {
      id: { in: ids },
      workspace_id: filters.workspaceId,
    },
    data: {
      status: "pending",
      next_attempt_at: new Date(),
      last_error: null,
    },
  });

  return updateResult.count;
}
