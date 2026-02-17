import { createHash, createHmac, randomBytes } from "crypto";

export function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createApiKey() {
  const suffix = randomBytes(24).toString("hex");
  const plainKey = `lv_sk_${suffix}`;
  const hashedKey = hashValue(plainKey);
  const prefix = plainKey.slice(0, 12);

  return { plainKey, hashedKey, prefix };
}

export function createSigningSecret() {
  const plainSecret = `lv_whsec_${randomBytes(24).toString("hex")}`;
  const hashedSecret = hashValue(plainSecret);
  const prefix = plainSecret.slice(0, 12);

  return { plainSecret, hashedSecret, prefix };
}

export function resolveApiKeyFromHeaders(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  return request.headers.get("x-api-key")?.trim() ?? null;
}

export function createWebhookSignature(secretHash: string, timestamp: string, payload: string) {
  const signatureBase = `${timestamp}.${payload}`;
  return createHmac("sha256", secretHash).update(signatureBase).digest("hex");
}
