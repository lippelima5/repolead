import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { onError } from "@/lib/helper";
import { CustomError } from "@/lib/errors";
import { parseJsonBody } from "@/lib/validation";
import { destinationCreateBodySchema } from "@/lib/schemas";
import { requireWorkspace } from "@/lib/leadvault/workspace";
import { createSigningSecret, hashValue } from "@/lib/leadvault/security";
import { getDestinationModuleByIntegrationId } from "@/lib/integrations/catalog";
import { Prisma } from "@/prisma/generated/client";

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const limit = Math.min(200, Number(request.nextUrl.searchParams.get("limit") || 20));
    const offset = Math.max(0, Number(request.nextUrl.searchParams.get("offset") || 0));

    const where = {
      workspace_id: workspaceId,
      ...(search
        ? {
            OR: [{ name: { contains: search, mode: "insensitive" as const } }, { url: { contains: search, mode: "insensitive" as const } }],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.destination.findMany({
        where,
        include: {
          _count: {
            select: {
              deliveries: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.destination.count({ where }),
    ]);

    return apiSuccess({
      items,
      meta: { total, limit, offset },
    });
  } catch (error) {
    return onError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace(request, { requireAdmin: true });
    const body = await parseJsonBody(request, destinationCreateBodySchema);
    const integrationId = body.integration_id || "custom-destination";
    const integrationModule = getDestinationModuleByIntegrationId(integrationId);
    let integrationConfig = body.integration_config_json || {};

    if (integrationModule) {
      const parsedConfig = integrationModule.configSchema.safeParse(integrationConfig);
      if (!parsedConfig.success) {
        const errors = parsedConfig.error.flatten().fieldErrors;
        throw new CustomError("Invalid integration configuration", 422, errors);
      }
      integrationConfig = parsedConfig.data;
    }

    const generatedSecret = body.signing_secret ? null : createSigningSecret();
    const plainSecret = body.signing_secret ?? generatedSecret?.plainSecret ?? null;
    const signingSecretHash = plainSecret ? hashValue(plainSecret) : null;
    const signingSecretPrefix = plainSecret ? plainSecret.slice(0, 12) : null;

    const destination = await prisma.destination.create({
      data: {
        workspace_id: workspaceId,
        name: body.name,
        url: body.url,
        method: body.method,
        headers_json: body.headers_json,
        signing_secret_hash: signingSecretHash,
        signing_secret_prefix: signingSecretPrefix,
        enabled: body.enabled,
        subscribed_events_json: body.subscribed_events_json,
        integration_id: integrationId,
        integration_config_json: integrationConfig as Prisma.InputJsonValue,
      },
    });

    return apiSuccess(
      {
        ...destination,
        signing_secret: plainSecret,
      },
      {
        status: 201,
        message: plainSecret
          ? "Destination created (signing secret is shown only once)"
          : "Destination created",
      },
    );
  } catch (error) {
    return onError(error);
  }
}
