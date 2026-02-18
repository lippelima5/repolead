import process from "node:process";

function toInt(rawValue, fallback, min = Number.MIN_SAFE_INTEGER) {
  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.floor(value));
}

const port = toInt(process.env.PORT, 3000, 1);
const timeoutMs = toInt(process.env.HEALTHCHECK_TIMEOUT_MS, 5000, 1000);
const url = process.env.HEALTHCHECK_URL || `http://127.0.0.1:${port}/api/internal/health`;

try {
  const response = await fetch(url, {
    method: "GET",
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`status=${response.status}`);
  }

  process.exit(0);
} catch (error) {
  console.error("[healthcheck] failed", error instanceof Error ? error.message : error);
  process.exit(1);
}
