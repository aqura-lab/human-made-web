// Lightweight, DB-backed failed-login lockout (no external rate-limit infra).
// Pure state transitions; the login route persists the result on the User row.

export const MAX_ATTEMPTS = 8;
export const LOCK_MINUTES = 15;

export type LockState = { failedLoginCount: number; lockedUntil: Date | null };

export function isLocked(user: { lockedUntil: Date | null }, now: Date): boolean {
  return user.lockedUntil !== null && user.lockedUntil.getTime() > now.getTime();
}

/**
 * Apply one failed attempt. Below the threshold, just increment. On the
 * MAX_ATTEMPTS-th failure, lock for LOCK_MINUTES and reset the counter so the
 * user gets a fresh budget once the lock expires.
 */
export function nextFailureState(count: number, now: Date): LockState {
  const next = count + 1;
  if (next >= MAX_ATTEMPTS) {
    return { failedLoginCount: 0, lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000) };
  }
  return { failedLoginCount: next, lockedUntil: null };
}

/** Applied on any successful login. */
export function resetState(): LockState {
  return { failedLoginCount: 0, lockedUntil: null };
}
