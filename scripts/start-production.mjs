import { spawn } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const WINDOWS = process.platform === "win32";
const NPX = WINDOWS ? "npx.cmd" : "npx";
const NODE = WINDOWS ? "node.exe" : "node";
const SHUTDOWN_TIMEOUT_MS = toInt(process.env.PROCESS_SHUTDOWN_TIMEOUT_MS, 15000, 1000);
const WORKER_STARTUP_DELAY_MS = toInt(process.env.DELIVERY_WORKER_STARTUP_DELAY_MS, 5000, 0);

const services = new Map();
let shuttingDown = false;

function toInt(rawValue, fallback, min = Number.MIN_SAFE_INTEGER) {
  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.floor(value));
}

function toBoolean(rawValue, fallback = false) {
  if (rawValue === undefined) {
    return fallback;
  }
  const normalized = String(rawValue).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function waitChildExit(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }
    child.once("exit", () => resolve());
  });
}

async function runStep(name, command, args) {
  console.log(`[init] ${name}`);
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
      cwd: process.cwd(),
    });

    child.once("error", (error) => reject(error));
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`[init] ${name} failed (code=${code ?? "null"} signal=${signal ?? "null"})`));
    });
  });
}

function startService(name, command, args) {
  const child = spawn(command, args, {
    stdio: "inherit",
    env: process.env,
    cwd: process.cwd(),
  });

  services.set(name, child);

  child.once("error", (error) => {
    console.error(`[supervisor] ${name} start error`, error);
    void shutdown(1, `${name} start error`);
  });

  child.once("exit", (code, signal) => {
    services.delete(name);

    if (shuttingDown) {
      return;
    }

    console.error(`[supervisor] ${name} exited (code=${code ?? "null"} signal=${signal ?? "null"})`);
    void shutdown(code === 0 ? 1 : (code ?? 1), `${name} exited unexpectedly`);
  });
}

async function stopService(name, child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  console.log(`[supervisor] stopping ${name}`);
  child.kill("SIGTERM");

  await Promise.race([waitChildExit(child), delay(SHUTDOWN_TIMEOUT_MS)]);

  if (child.exitCode === null && child.signalCode === null) {
    console.warn(`[supervisor] forcing ${name} to stop`);
    child.kill("SIGKILL");
    await waitChildExit(child);
  }
}

async function shutdown(exitCode, reason) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (reason) {
    console.log(`[supervisor] shutdown requested: ${reason}`);
  }

  const activeServices = [...services.entries()];
  for (const [name, child] of activeServices) {
    await stopService(name, child);
  }

  process.exit(exitCode);
}

process.on("SIGTERM", () => void shutdown(0, "SIGTERM"));
process.on("SIGINT", () => void shutdown(0, "SIGINT"));
process.on("uncaughtException", (error) => {
  console.error("[supervisor] uncaught exception", error);
  void shutdown(1, "uncaughtException");
});
process.on("unhandledRejection", (error) => {
  console.error("[supervisor] unhandled rejection", error);
  void shutdown(1, "unhandledRejection");
});

async function main() {
  await runStep("applying database migrations", NPX, ["prisma", "migrate", "deploy"]);

  startService("app", NPX, ["next", "start"]);

  const workerEnabled = toBoolean(process.env.DELIVERY_WORKER_ENABLED, true);
  if (workerEnabled) {
    if (!process.env.CRON_SECRET) {
      throw new Error("CRON_SECRET is required when DELIVERY_WORKER_ENABLED=true");
    }

    if (WORKER_STARTUP_DELAY_MS > 0) {
      await delay(WORKER_STARTUP_DELAY_MS);
    }

    startService("worker", NODE, ["scripts/delivery-worker.mjs"]);
  } else {
    console.log("[supervisor] delivery worker disabled");
  }

  await new Promise(() => undefined);
}

main().catch((error) => {
  console.error("[supervisor] startup failed", error);
  process.exit(1);
});
