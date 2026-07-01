import { isLocked, nextFailureState, resetState, MAX_ATTEMPTS, LOCK_MINUTES } from "@/lib/auth/lockout";

const now = new Date("2026-07-01T12:00:00Z");

describe("isLocked", () => {
  it("is true only while lockedUntil is in the future", () => {
    expect(isLocked({ lockedUntil: null }, now)).toBe(false);
    expect(isLocked({ lockedUntil: new Date(now.getTime() - 1000) }, now)).toBe(false);
    expect(isLocked({ lockedUntil: new Date(now.getTime() + 1000) }, now)).toBe(true);
  });
});

describe("nextFailureState", () => {
  it("increments below the threshold without locking", () => {
    expect(nextFailureState(0, now)).toEqual({ failedLoginCount: 1, lockedUntil: null });
    expect(nextFailureState(MAX_ATTEMPTS - 2, now)).toEqual({
      failedLoginCount: MAX_ATTEMPTS - 1,
      lockedUntil: null,
    });
  });

  it("locks and resets the count on the MAX_ATTEMPTS-th failure", () => {
    const s = nextFailureState(MAX_ATTEMPTS - 1, now);
    expect(s.failedLoginCount).toBe(0);
    expect(s.lockedUntil).toEqual(new Date(now.getTime() + LOCK_MINUTES * 60_000));
  });
});

describe("resetState", () => {
  it("clears the count and the lock", () => {
    expect(resetState()).toEqual({ failedLoginCount: 0, lockedUntil: null });
  });
});
