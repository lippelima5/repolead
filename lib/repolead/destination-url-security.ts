import dns from "node:dns/promises";
import net from "node:net";
import { CustomError } from "@/lib/errors";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata",
  "metadata.google.internal",
  "instance-data",
  "instance-data.ec2.internal",
]);

const BLOCKED_HOST_SUFFIXES = [".localhost", ".local", ".internal", ".localdomain", ".home.arpa"];

function parseIpv4(value: string) {
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(value)) {
    return null;
  }

  const parts = value.split(".").map((item) => Number(item));
  if (parts.length !== 4 || parts.some((item) => !Number.isInteger(item) || item < 0 || item > 255)) {
    return null;
  }

  return parts;
}

function isPrivateIpv4(value: string) {
  const parts = parseIpv4(value);
  if (!parts) {
    return false;
  }

  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;

  return false;
}

function extractMappedIpv4(value: string) {
  const match = value.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return match?.[1] ?? null;
}

function isPrivateIpv6(value: string) {
  const normalized = value.toLowerCase();

  if (normalized === "::" || normalized === "::1") {
    return true;
  }

  const mappedIpv4 = extractMappedIpv4(normalized);
  if (mappedIpv4) {
    return isPrivateIpv4(mappedIpv4);
  }

  const firstChunk = normalized.split(":")[0] || "0";
  const firstHextet = Number.parseInt(firstChunk, 16);
  if (!Number.isFinite(firstHextet)) {
    return true;
  }

  if ((firstHextet & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((firstHextet & 0xffc0) === 0xfe80) return true; // fe80::/10 link local
  if ((firstHextet & 0xff00) === 0xff00) return true; // ff00::/8 multicast

  return false;
}

function isBlockedIp(value: string) {
  const ipVersion = net.isIP(value);
  if (ipVersion === 4) {
    return isPrivateIpv4(value);
  }

  if (ipVersion === 6) {
    return isPrivateIpv6(value);
  }

  return false;
}

function normalizeHostname(value: string) {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

function isBlockedHostname(hostname: string) {
  const normalized = normalizeHostname(hostname);

  if (BLOCKED_HOSTNAMES.has(normalized)) {
    return true;
  }

  if (BLOCKED_HOST_SUFFIXES.some((suffix) => normalized.endsWith(suffix))) {
    return true;
  }

  if (!normalized.includes(".") && net.isIP(normalized) === 0) {
    return true;
  }

  return false;
}

async function resolveHostIps(hostname: string) {
  try {
    const rows = await dns.lookup(hostname, { all: true, verbatim: true });
    return [...new Set(rows.map((item) => item.address))];
  } catch {
    throw new CustomError("Destination host could not be resolved", 422);
  }
}

export async function assertPublicDestinationUrl(rawUrl: string) {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new CustomError("Destination URL is invalid", 422);
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new CustomError("Destination URL must use HTTP or HTTPS", 422);
  }

  const hostname = normalizeHostname(parsed.hostname);
  if (!hostname) {
    throw new CustomError("Destination URL hostname is invalid", 422);
  }

  if (isBlockedHostname(hostname)) {
    throw new CustomError("Destination host is blocked for security reasons", 422);
  }

  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) {
      throw new CustomError("Destination IP is private or restricted", 422);
    }
    return;
  }

  const addresses = await resolveHostIps(hostname);
  if (!addresses.length) {
    throw new CustomError("Destination host has no routable address", 422);
  }

  if (addresses.some((address) => isBlockedIp(address))) {
    throw new CustomError("Destination host resolves to private or restricted IP", 422);
  }
}
