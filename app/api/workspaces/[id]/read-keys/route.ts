import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { onError, verifyUserWorkspace } from "@/lib/helper";
import { parseJsonBody } from "@/lib/validation";
import { workspaceReadKeyCreateBodySchema } from "@/lib/schemas";
import { createWorkspaceReadApiKey } from "@/lib/leadvault/read-api-key";

function parseId(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const workspaceId = parseId((await params).id);
    if (!workspaceId) {
      return apiError("Workspace id is required", 400);
    }

    await verifyUserWorkspace(request, true, workspaceId);

    const items = await prisma.workspace_read_api_key.findMany({
      where: {
        workspace_id: workspaceId,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        last_used_at: true,
        revoked_at: true,
        created_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return apiSuccess(items);
  } catch (error) {
    return onError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const workspaceId = parseId((await params).id);
    if (!workspaceId) {
      return apiError("Workspace id is required", 400);
    }

    await verifyUserWorkspace(request, true, workspaceId);
    const body = await parseJsonBody(request, workspaceReadKeyCreateBodySchema);
    const key = createWorkspaceReadApiKey();

    const created = await prisma.workspace_read_api_key.create({
      data: {
        workspace_id: workspaceId,
        name: body.name,
        hashed_key: key.hashedKey,
        prefix: key.prefix,
      },
    });

    return apiSuccess(
      {
        id: created.id,
        name: created.name,
        prefix: created.prefix,
        plain_key: key.plainKey,
        created_at: created.created_at,
      },
      {
        status: 201,
        message: "Read API key created (this value is shown only once)",
      },
    );
  } catch (error) {
    return onError(error);
  }
}
