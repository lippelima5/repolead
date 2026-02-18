import prisma from "@/lib/prisma";
import { createWebhookSignature } from "@/lib/repolead/security";
import { CustomError } from "@/lib/errors";
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

type SendyConfig = {
  apiKey: string;
  listId: string;
  gdpr: boolean;
  silent: boolean;
  country?: string;
  referrer?: string;
  honeypot?: string;
};

function getJsonRecord(value: Prisma.JsonValue | null | undefined): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const entries = Object.entries(value as Record<string, unknown>).filter(([, item]) => typeof item === "string");
  return Object.fromEntries(entries) as Record<string, string>;
}

function getUnknownRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getJsonObject(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function getTrimmedString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveSendyConfig(destinationItem: destination): SendyConfig | { error: string } {
  const config = getJsonObject(destinationItem.integration_config_json);
  const apiKey = getTrimmedString(config.api_key);
  if (!apiKey) {
    return { error: "Sendy configuration is missing api_key" };
  }

  const listId = getTrimmedString(config.list_id);
  if (!listId) {
    return { error: "Sendy configuration is missing list_id" };
  }

  const country = getTrimmedString(config.country);
  if (country && !/^[a-zA-Z]{2}$/.test(country)) {
    return { error: "Sendy configuration has invalid country code" };
  }

  const referrer = getTrimmedString(config.referrer);
  const honeypot = getTrimmedString(config.hp);

  return {
    apiKey,
    listId,
    gdpr: config.gdpr === true,
    silent: config.silent === true,
    ...(country ? { country: country.toUpperCase() } : {}),
    ...(referrer ? { referrer } : {}),
    ...(honeypot ? { honeypot } : {}),
  };
}

function buildSendyBody(payload: Record<string, unknown>, config: SendyConfig): { bodyText: string } | { error: string } {
  const lead = getUnknownRecord(payload.lead);
  if (!lead) {
    return { error: "Sendy delivery requires lead payload" };
  }

  const email = getTrimmedString(lead.email);
  if (!email) {
    return { error: "Lead email is required for Sendy delivery" };
  }

  const name = getTrimmedString(lead.name);
  const body = new URLSearchParams();
  body.set("api_key", config.apiKey);
  body.set("list", config.listId);
  body.set("email", email);
  body.set("boolean", "true");

  if (name) {
    body.set("name", name);
  }

  if (config.country) {
    body.set("country", config.country);
  }

  if (config.referrer) {
    body.set("referrer", config.referrer);
  }

  if (config.gdpr) {
    body.set("gdpr", "true");
  }

  if (config.silent) {
    body.set("silent", "true");
  }

  if (config.honeypot) {
    body.set("hp", config.honeypot);
  }

  return { bodyText: body.toString() };
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
  let bodyText = JSON.stringify(payload);
  let method = destinationItem.method.toUpperCase();
  let contentType = "application/json";
  let failedMessage: string | null = null;

  if (destinationItem.integration_id === "sendy") {
    const resolvedConfig = resolveSendyConfig(destinationItem);
    if ("error" in resolvedConfig) {
      failedMessage = resolvedConfig.error;
    } else {
      const sendyBody = buildSendyBody(payload, resolvedConfig);
      if ("error" in sendyBody) {
        failedMessage = sendyBody.error;
      } else {
        bodyText = sendyBody.bodyText;
        method = "POST";
        contentType = "application/x-www-form-urlencoded";
      }
    }
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = destinationItem.signing_secret_hash
    ? createWebhookSignature(destinationItem.signing_secret_hash, timestamp, bodyText)
    : null;

  const customHeaders = getJsonRecord(destinationItem.headers_json);
  const headers: Record<string, string> = {
    ...customHeaders,
    "content-type": contentType,
    "x-repolead-timestamp": timestamp,
    "x-repolead-event": deliveryItem.event_type,
    "x-repolead-delivery-id": deliveryItem.id,
  };

  if (signature) {
    headers["x-repolead-signature"] = signature;
  }

  let responseStatus: number | null = null;
  let responseBody = "";

  if (!failedMessage) {
    try {
      const response = await fetchWithTimeout(
        destinationItem.url,
        {
          method,
          headers,
          body: bodyText,
        },
        DELIVERY_TIMEOUT_MS,
      );

      responseStatus = response.status;
      responseBody = (await response.text()).slice(0, 5000);

      if (!response.ok) {
        failedMessage = `HTTP ${response.status}`;
      } else if (destinationItem.integration_id === "sendy") {
        const normalizedBody = responseBody.trim().toLowerCase();
        if (normalizedBody !== "true" && normalizedBody !== "1") {
          failedMessage = responseBody.trim() || "Sendy returned an unexpected response";
        }
      }
    } catch (error) {
      failedMessage = error instanceof Error ? error.message : "Unknown delivery error";
    }
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

type EnqueueAllLeadsToDestinationParams = {
  workspaceId: number;
  destinationId: string;
  delayMs: number;
  eventType?: string;
};

export async function enqueueAllLeadsToDestination(params: EnqueueAllLeadsToDestinationParams) {
  const targetDestination = await prisma.destination.findFirst({
    where: {
      id: params.destinationId,
      workspace_id: params.workspaceId,
    },
    select: {
      id: true,
      enabled: true,
    },
  });

  if (!targetDestination) {
    throw new CustomError("Destination not found", 404);
  }

  if (!targetDestination.enabled) {
    throw new CustomError("Destination is disabled", 422);
  }

  const batchSize = 500;
  const baseTimestamp = Date.now();
  const eventType = params.eventType?.trim() || "lead_created";
  let cursorId: string | undefined;
  let scheduled = 0;

  while (true) {
    const leads = await prisma.lead.findMany({
      where: { workspace_id: params.workspaceId },
      select: { id: true },
      orderBy: { id: "asc" },
      take: batchSize,
      ...(cursorId
        ? {
            cursor: { id: cursorId },
            skip: 1,
          }
        : {}),
    });

    if (leads.length === 0) {
      break;
    }

    await prisma.delivery.createMany({
      data: leads.map((lead, index) => ({
        workspace_id: params.workspaceId,
        destination_id: params.destinationId,
        lead_id: lead.id,
        event_type: eventType,
        status: "pending",
        next_attempt_at: new Date(baseTimestamp + (scheduled + index) * params.delayMs),
      })),
    });

    scheduled += leads.length;
    cursorId = leads[leads.length - 1]?.id;
  }

  return scheduled;
}
