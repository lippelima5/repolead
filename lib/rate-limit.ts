import { Prisma } from "@/prisma/generated/client";
import prisma from "@/lib/prisma";

const STORE_SYMBOL = Symbol.for("saas-template.rate-limit");

type Bucket = {
  count: number;
  resetAt: number;
};

type LimitParams = {
  namespace: string;
  identifier: string;
  limit: number;
  windowMs: number;
};

type LimitResult = {
  limited: boolean;
  retryAfterSeconds: number;
};

type GlobalWithStore = typeof globalThis & {
  [STORE_SYMBOL]?: Map<string, Bucket>;
};

const globalWithStore = globalThis as GlobalWithStore;

function getStore() {
  if (!globalWithStore[STORE_SYMBOL]) {
    globalWithStore[STORE_SYMBOL] = new Map<string, Bucket>();
  }

  return globalWithStore[STORE_SYMBOL]!;
}

function cleanupStore(now: number) {
  const store = getStore();
  for (const [key, value] of store.entries()) {
    if (value.resetAt <= now) {
      store.delete(key);
    }
  }
}

function checkRateLimitInMemory(params: LimitParams): LimitResult {
  const now = Date.now();
  cleanupStore(now);

  const store = getStore();
  const key = `${params.namespace}:${params.identifier}`;
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + params.windowMs });
    return { limited: false, retryAfterSeconds: 0 };
  }

  current.count += 1;
  store.set(key, current);

  if (current.count > params.limit) {
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  return { limited: false, retryAfterSeconds: 0 };
}

async function checkRateLimitInDatabase(params: LimitParams): Promise<LimitResult> {
  const now = Date.now();
  const key = `${params.namespace}:${params.identifier}`;
  const nextResetAt = new Date(now + params.windowMs);

  const rows = await prisma.$queryRaw<{ count: number; reset_at: Date }[]>(Prisma.sql`
    INSERT INTO "rate_limit_window" ("key", "count", "reset_at", "created_at", "updated_at")
    VALUES (${key}, 1, ${nextResetAt}, NOW(), NOW())
    ON CONFLICT ("key") DO UPDATE
    SET
      "count" = CASE
        WHEN "rate_limit_window"."reset_at" <= NOW() THEN 1
        ELSE "rate_limit_window"."count" + 1
      END,
      "reset_at" = CASE
        WHEN "rate_limit_window"."reset_at" <= NOW() THEN ${nextResetAt}
        ELSE "rate_limit_window"."reset_at"
      END,
      "updated_at" = NOW()
    RETURNING "count", "reset_at"
  `);

  const row = rows[0];

  if (!row) {
    return { limited: false, retryAfterSeconds: 0 };
  }

  if (Math.random() < 0.02) {
    void prisma.rate_limit_window.deleteMany({
      where: {
        reset_at: {
          lt: new Date(),
        },
      },
    });
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((new Date(row.reset_at).getTime() - now) / 1000));

  if (row.count > params.limit) {
    return {
      limited: true,
      retryAfterSeconds,
    };
  }

  return { limited: false, retryAfterSeconds: 0 };
}

export async function checkRateLimit(params: LimitParams): Promise<LimitResult> {
  if (process.env.NODE_ENV === "production") {
    return checkRateLimitInDatabase(params);
  }

  return checkRateLimitInMemory(params);
}


