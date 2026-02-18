import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

class FatalWorkerError extends Error { }

function toInt(rawValue, fallback, min = Number.MIN_SAFE_INTEGER) {
  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.floor(value));
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

const port = toInt(process.env.PORT, 3000, 1);
const baseUrl = trimTrailingSlash(process.env.DELIVERY_WORKER_TARGET_URL || `http://127.0.0.1:${port}`);
const intervalMs = toInt(process.env.DELIVERY_WORKER_INTERVAL_MS, 5000, 1000);
const requestTimeoutMs = toInt(process.env.DELIVERY_WORKER_REQUEST_TIMEOUT_MS, 15000, 1000);
const maxBackoffMs = toInt(process.env.DELIVERY_WORKER_MAX_BACKOFF_MS, 60000, 2000);
const limit = toInt(process.env.DELIVERY_WORKER_LIMIT, 100, 1);
const cronSecret = process.env.CRON_SECRET;

if (!cronSecret) {
  console.error("[worker] CRON_SECRET is required");
  process.exit(1);
}

const controller = new AbortController();
let stopping = false;
let consecutiveFailures = 0;

process.on("SIGTERM", () => {
  stopping = true;
  controller.abort();
});

process.on("SIGINT", () => {
  stopping = true;
  controller.abort();
});

function buildEndpoint() {
  const url = new URL("/api/internal/cron/deliveries", baseUrl);
  url.searchParams.set("limit", String(limit));
  return url.toString();
}

async function sleepWithAbort(ms) {
  if (ms <= 0) {
    return;
  }

  try {
    await delay(ms, undefined, { signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return;
    }
    throw error;
  }
}

async function runCycle() {
  const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(requestTimeoutMs)]);
  const startedAt = Date.now();

  const response = await fetch(buildEndpoint(), {
    method: "POST",
    headers: {
      authorization: `Bearer ${cronSecret}`,
    },
    signal,
  });

  const durationMs = Date.now() - startedAt;

  if (response.status === 401 || response.status === 403 || response.status === 404) {
    const body = (await response.text()).slice(0, 300);
    throw new FatalWorkerError(`[worker] fatal response ${response.status}: ${body}`);
  }

  if (!response.ok) {
    const body = (await response.text()).slice(0, 300);
    throw new Error(`[worker] cron failed status=${response.status} body=${body}`);
  }

  const payload = await response.json().catch(() => null);
  const processed = Number(payload?.data?.processed ?? payload?.processed ?? 0);

  // Log only if there were deliveries processed to reduce noise
  if (processed > 0) {
    console.log(`[worker] cycle processed=${processed} duration_ms=${durationMs}`);
  }
}

async function main() {
  console.log(`[worker] started base_url=${baseUrl} interval_ms=${intervalMs} limit=${limit}`);

  while (!stopping) {
    const cycleStartedAt = Date.now();

    try {
      await runCycle();
      consecutiveFailures = 0;

      const cycleDuration = Date.now() - cycleStartedAt;
      const sleepMs = Math.max(0, intervalMs - cycleDuration);
      await sleepWithAbort(sleepMs);
    } catch (error) {
      if (stopping) {
        break;
      }

      if (error instanceof FatalWorkerError) {
        console.error(error.message);
        process.exit(1);
      }

      consecutiveFailures += 1;
      const backoffBase = intervalMs * Math.pow(2, Math.min(consecutiveFailures, 6));
      const jitter = Math.floor(Math.random() * 1000);
      const backoffMs = Math.min(maxBackoffMs, backoffBase + jitter);

      console.error(
        `[worker] cycle error failures=${consecutiveFailures} backoff_ms=${backoffMs}`,
        error instanceof Error ? error.message : error,
      );

      await sleepWithAbort(backoffMs);
    }
  }

  console.log("[worker] stopped");
}

main().catch((error) => {
  console.error("[worker] fatal", error);
  process.exit(1);
});
