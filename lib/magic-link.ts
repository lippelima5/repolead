import { createHash, randomBytes } from "node:crypto";
import SendAuthMagicLink from "@/emails/send-auth-magic-link";
import { getAppBaseUrl } from "@/lib/app-url";
import { CustomError } from "@/lib/errors";
import prisma from "@/lib/prisma";

const DEFAULT_MAGIC_LINK_EXPIRATION_MINUTES = 20;

export function getMagicLinkExpiresInMinutes() {
  const parsed = Number(process.env.MAGIC_LINK_EXPIRES_IN_MINUTES);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MAGIC_LINK_EXPIRATION_MINUTES;
  }

  return Math.floor(parsed);
}

export function hashMagicToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export async function issueUserMagicLink(userId: number, originFallback?: string) {
  const account = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      suspended_at: true,
    },
  });

  if (!account) {
    throw new CustomError("User not found", 404);
  }

  if (account.suspended_at) {
    throw new CustomError("User is suspended", 409);
  }

  const rawToken = randomBytes(32).toString("hex");
  const hashedToken = hashMagicToken(rawToken);
  const expiresAt = new Date(Date.now() + getMagicLinkExpiresInMinutes() * 60 * 1000);

  await prisma.user.update({
    where: { id: account.id },
    data: {
      verification_token: hashedToken,
      verification_token_expires_at: expiresAt,
    },
  });

  const appUrl = getAppBaseUrl(originFallback);
  const magicUrl = new URL("/login", appUrl);
  magicUrl.searchParams.set("magic", rawToken);
  magicUrl.searchParams.set("email", account.email);

  const mail = new SendAuthMagicLink({
    name: account.name || account.email,
    url: magicUrl.toString(),
    receivers: account.email,
  });

  await mail.sendSafe("Seu link de acesso");

  return {
    email: account.email,
    expires_at: expiresAt,
  };
}
