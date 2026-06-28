import { prisma } from "@/lib/db";
import { generateToken, tokenExpiry } from "./token";
import { sendMagicLink } from "./email";

export function appUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

/** Create a single-use magic-link token for a user and email them the link. */
export async function issueMagicLink(
  userId: string,
  email: string,
  now: Date = new Date(),
): Promise<void> {
  const { raw, hash } = generateToken();
  await prisma.magicLinkToken.create({
    data: { tokenHash: hash, userId, expiresAt: tokenExpiry(now) },
  });
  const url = `${appUrl()}/api/auth/callback?token=${encodeURIComponent(raw)}`;
  await sendMagicLink({ to: email, url });
}
