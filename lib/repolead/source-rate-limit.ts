import { Prisma } from "@/prisma/generated/client";
import prisma from "@/lib/prisma";

type SourceLimitParams = {
  workspaceId: number;
  sourceId: string;
  limitPerMinute: number;
};

export async function checkSourceRateLimit(params: SourceLimitParams) {
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setSeconds(0, 0);

  const bucketKey = `${params.workspaceId}:${params.sourceId}:${windowStart.toISOString()}`;

  const rows = await prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
    INSERT INTO "source_rate_limit_bucket" ("key", "workspace_id", "source_id", "window_start", "count", "created_at", "updated_at")
    VALUES (${bucketKey}, ${params.workspaceId}, ${params.sourceId}, ${windowStart}, 1, NOW(), NOW())
    ON CONFLICT ("key") DO UPDATE
    SET
      "count" = "source_rate_limit_bucket"."count" + 1,
      "updated_at" = NOW()
    RETURNING "count"
  `);

  const count = rows[0]?.count ?? 0;
  const retryAfterSeconds = Math.max(1, 60 - now.getSeconds());

  return {
    limited: count > params.limitPerMinute,
    retryAfterSeconds,
    count,
  };
}
