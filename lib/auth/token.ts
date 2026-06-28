import { randomBytes, createHash } from "node:crypto";

// Magic-link tokens. Only the SHA-256 hash is ever persisted; the raw token
// lives only in the emailed URL. Tokens are single-use and short-lived.

const TOKEN_TTL_MINUTES = 15;

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashToken(raw) };
}

export function tokenExpiry(now: Date, minutes: number = TOKEN_TTL_MINUTES): Date {
  return new Date(now.getTime() + minutes * 60_000);
}

export function isTokenUsable(
  token: { usedAt: Date | null; expiresAt: Date },
  now: Date,
): boolean {
  if (token.usedAt !== null) return false;
  return token.expiresAt.getTime() > now.getTime();
}
