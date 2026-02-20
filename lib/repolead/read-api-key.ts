import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { hashValue, isWorkspaceReadApiKey, resolveApiKeyFromHeaders } from "@/lib/repolead/security";
import { CustomError } from "@/lib/errors";

export const PUBLIC_READ_RATE_LIMIT_PER_MIN = 120;

export type WorkspaceReadApiKeyAuth = {
  id: string;
  workspaceId: number;
  name: string;
  prefix: string;
};

export function createWorkspaceReadApiKey() {
  const suffix = randomBytes(24).toString("hex");
  const plainKey = `lv_rk_${suffix}`;
  const hashedKey = hashValue(plainKey);
  const prefix = plainKey.slice(0, 12);

  return { plainKey, hashedKey, prefix };
}

export async function requireWorkspaceReadApiKey(request: Request): Promise<WorkspaceReadApiKeyAuth> {
  const plainApiKey = resolveApiKeyFromHeaders(request);
  if (!plainApiKey) {
    throw new CustomError("Missing API key", 401);
  }

  if (!isWorkspaceReadApiKey(plainApiKey)) {
    throw new CustomError("This API key does not allow read operations", 403);
  }

  const hashedKey = hashValue(plainApiKey);
  const keyRecord = await prisma.workspace_read_api_key.findFirst({
    where: {
      hashed_key: hashedKey,
      revoked_at: null,
    },
    select: {
      id: true,
      workspace_id: true,
      name: true,
      prefix: true,
    },
  });

  if (!keyRecord) {
    throw new CustomError("Invalid API key", 401);
  }

  return {
    id: keyRecord.id,
    workspaceId: keyRecord.workspace_id,
    name: keyRecord.name,
    prefix: keyRecord.prefix,
  };
}

export async function checkWorkspaceReadApiKeyLimit(
  keyId: string,
  options?: { limit?: number; windowMs?: number },
) {
  return checkRateLimit({
    namespace: "repolead:v1:leads:read",
    identifier: keyId,
    limit: options?.limit ?? PUBLIC_READ_RATE_LIMIT_PER_MIN,
    windowMs: options?.windowMs ?? 60 * 1000,
  });
}

export async function touchWorkspaceReadApiKey(keyId: string) {
  try {
    await prisma.workspace_read_api_key.update({
      where: { id: keyId },
      data: {
        last_used_at: new Date(),
      },
    });
  } catch {
    // Ignore touch failures, since they should not block API reads.
  }
}
