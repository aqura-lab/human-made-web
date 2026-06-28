import { nanoid } from "nanoid";

// Pure referral-attribution helpers. Persistence and the priority bump live in
// the auth callback; these encode the rules that keep the referral graph a DAG.

/** URL-safe referral code (nanoid alphabet is already [A-Za-z0-9_-]). */
export function generateReferralCode(): string {
  return nanoid(10);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** A user may not refer their own signup email. */
export function isSelfReferral(referrerEmail: string, signupEmail: string): boolean {
  return normalizeEmail(referrerEmail) === normalizeEmail(signupEmail);
}

/**
 * True if attributing `newUserId` under a referrer whose ancestry (walking up
 * `referredBy`) is `referrerAncestry` would create a cycle. Phase 1 sets
 * `referredById` once at signup so cycles are structurally impossible; this
 * guard protects any future re-attribution path.
 */
export function wouldCreateCycle(newUserId: string, referrerAncestry: string[]): boolean {
  return referrerAncestry.includes(newUserId);
}
