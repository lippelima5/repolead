import { PrismaClientKnownRequestError } from "@/prisma/generated/internal/prismaNamespace";
import prisma from "@/lib/prisma";
import { enqueueDeliveries } from "@/lib/repolead/delivery";

type IdentityInput = {
  type: "email" | "phone" | "external";
  value: string;
  normalizedValue: string;
};

function normalizeEmail(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.includes("@") ? normalized : null;
}

function normalizePhone(value: string | null) {
  if (!value) {
    return null;
  }

  const digits = value.replace(/[^\d+]/g, "");
  if (digits.length < 8) {
    return null;
  }

  return digits.startsWith("+") ? digits : digits.replace(/^\+?/, "");
}

function normalizeExternal(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function getStringField(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function getTags(payload: Record<string, unknown>) {
  const value = payload.tags;
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function extractIdentities(payload: Record<string, unknown>) {
  const identities: IdentityInput[] = [];

  const email = normalizeEmail(getStringField(payload, ["email", "mail"]));
  if (email) {
    identities.push({
      type: "email",
      value: email,
      normalizedValue: email,
    });
  }

  const phoneRaw = getStringField(payload, ["phone", "telefone", "mobile"]);
  const phone = normalizePhone(phoneRaw);
  if (phone) {
    identities.push({
      type: "phone",
      value: phoneRaw ?? phone,
      normalizedValue: phone,
    });
  }

  const external = normalizeExternal(getStringField(payload, ["external_id", "externalId", "lead_id"]));
  if (external) {
    identities.push({
      type: "external",
      value: external,
      normalizedValue: external.toLowerCase(),
    });
  }

  return identities;
}

function parsePayloadObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

async function mergeLeadIntoTarget(targetLeadId: string, sourceLeadId: string) {
  const identities = await prisma.lead_identity.findMany({
    where: { lead_id: sourceLeadId },
  });

  for (const identity of identities) {
    try {
      await prisma.lead_identity.update({
        where: { id: identity.id },
        data: { lead_id: targetLeadId },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
        await prisma.lead_identity.delete({
          where: { id: identity.id },
        });
      } else {
        throw error;
      }
    }
  }

  await prisma.lead_event.updateMany({
    where: { lead_id: sourceLeadId },
    data: { lead_id: targetLeadId },
  });

  await prisma.delivery.updateMany({
    where: { lead_id: sourceLeadId },
    data: { lead_id: targetLeadId },
  });

  await prisma.lead.delete({
    where: { id: sourceLeadId },
  });
}

export async function processIngestion(ingestionId: string) {
  const ingestion = await prisma.ingestion.findUnique({
    where: { id: ingestionId },
  });

  if (!ingestion) {
    return;
  }

  const payload = parsePayloadObject(ingestion.raw_payload_json);
  const name = getStringField(payload, ["name", "full_name", "nome"]);
  const email = normalizeEmail(getStringField(payload, ["email", "mail"]));
  const phoneRaw = getStringField(payload, ["phone", "telefone", "mobile"]);
  const phone = normalizePhone(phoneRaw);
  const tags = getTags(payload);
  const identities = extractIdentities(payload);

  let createdLead = false;
  let targetLeadId: string | null = null;
  const mergedLeadIds: string[] = [];

  if (identities.length > 0) {
    const existingIdentities = await Promise.all(
      identities.map((identity) =>
        prisma.lead_identity.findUnique({
          where: {
            workspace_id_type_normalized_value: {
              workspace_id: ingestion.workspace_id,
              type: identity.type,
              normalized_value: identity.normalizedValue,
            },
          },
          select: { lead_id: true },
        }),
      ),
    );

    const leadIds = [...new Set(existingIdentities.map((item) => item?.lead_id).filter(Boolean))] as string[];

    if (leadIds.length === 0) {
      const created = await prisma.lead.create({
        data: {
          workspace_id: ingestion.workspace_id,
          name: name ?? undefined,
          email: email ?? undefined,
          phone: phone ?? undefined,
          status: "new",
          needs_identity: false,
          tags_json: tags,
        },
      });
      createdLead = true;
      targetLeadId = created.id;
    } else {
      const orderedLeads = await prisma.lead.findMany({
        where: {
          workspace_id: ingestion.workspace_id,
          id: { in: leadIds },
        },
        orderBy: { created_at: "asc" },
      });

      targetLeadId = orderedLeads[0]?.id ?? leadIds[0];

      for (const item of orderedLeads.slice(1)) {
        await mergeLeadIntoTarget(targetLeadId, item.id);
        mergedLeadIds.push(item.id);
      }
    }
  } else {
    const created = await prisma.lead.create({
      data: {
        workspace_id: ingestion.workspace_id,
        name: name ?? undefined,
        email: email ?? undefined,
        phone: phone ?? undefined,
        status: "needs_identity",
        needs_identity: true,
        tags_json: tags,
      },
    });
    createdLead = true;
    targetLeadId = created.id;
  }

  if (!targetLeadId) {
    await prisma.ingestion.update({
      where: { id: ingestion.id },
      data: { status: "failed" },
    });
    return;
  }

  const updatedLead = await prisma.lead.update({
    where: { id: targetLeadId },
    data: {
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(tags.length > 0 ? { tags_json: tags } : {}),
      needs_identity: identities.length === 0,
      status: identities.length === 0 ? "needs_identity" : undefined,
    },
  });

  for (const identity of identities) {
    await prisma.lead_identity.upsert({
      where: {
        workspace_id_type_normalized_value: {
          workspace_id: ingestion.workspace_id,
          type: identity.type,
          normalized_value: identity.normalizedValue,
        },
      },
      create: {
        workspace_id: ingestion.workspace_id,
        lead_id: updatedLead.id,
        source_id: ingestion.source_id,
        type: identity.type,
        value: identity.value,
        normalized_value: identity.normalizedValue,
      },
      update: {
        lead_id: updatedLead.id,
        source_id: ingestion.source_id,
        value: identity.value,
      },
    });
  }

  await prisma.lead_event.create({
    data: {
      workspace_id: ingestion.workspace_id,
      lead_id: updatedLead.id,
      type: "ingested",
      ingest_id: ingestion.id,
      actor_type: "system",
      reason: "Payload received by ingest endpoint",
    },
  });

  await prisma.lead_event.create({
    data: {
      workspace_id: ingestion.workspace_id,
      lead_id: updatedLead.id,
      type: "normalized",
      ingest_id: ingestion.id,
      actor_type: "system",
      new_value_json: {
        email,
        phone,
        identities: identities.map((item) => ({
          type: item.type,
          value: item.normalizedValue,
        })),
      },
    },
  });

  if (mergedLeadIds.length > 0) {
    await prisma.lead_event.create({
      data: {
        workspace_id: ingestion.workspace_id,
        lead_id: updatedLead.id,
        type: "merged",
        ingest_id: ingestion.id,
        actor_type: "system",
        old_value_json: { merged_lead_ids: mergedLeadIds },
      },
    });
  }

  const deliveryEventType = createdLead ? "lead_created" : "lead_updated";
  await enqueueDeliveries({
    workspaceId: ingestion.workspace_id,
    ingestId: ingestion.id,
    leadId: updatedLead.id,
    eventType: deliveryEventType,
  });

  await prisma.ingestion.update({
    where: { id: ingestion.id },
    data: {
      status: identities.length === 0 ? "needs_identity" : "processed",
    },
  });
}

export function enqueueIngestionProcessing(ingestionId: string) {
  setTimeout(() => {
    void processIngestion(ingestionId);
  }, 0);
}

export function parseFormUrlEncodedBody(rawBody: string) {
  const searchParams = new URLSearchParams(rawBody);
  const payload: Record<string, string | string[]> = {};

  for (const [key, value] of searchParams.entries()) {
    if (payload[key] === undefined) {
      payload[key] = value;
    } else if (Array.isArray(payload[key])) {
      (payload[key] as string[]).push(value);
    } else {
      payload[key] = [payload[key] as string, value];
    }
  }

  return payload;
}
