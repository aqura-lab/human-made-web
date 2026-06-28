import { isQueueEligible, isAhead, queuePosition, type QueueUser } from "@/lib/queue";

function u(p: Partial<QueueUser> & { id: string }): QueueUser {
  return {
    priorityBoost: 0,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    emailVerified: new Date("2026-01-01T00:00:00Z"),
    deletedAt: null,
    ...p,
  };
}

describe("isQueueEligible", () => {
  it("is true only for verified, non-deleted users", () => {
    expect(isQueueEligible(u({ id: "a" }))).toBe(true);
    expect(isQueueEligible(u({ id: "b", emailVerified: null }))).toBe(false);
    expect(isQueueEligible(u({ id: "c", deletedAt: new Date() }))).toBe(false);
  });
});

describe("isAhead", () => {
  it("ranks higher priorityBoost ahead", () => {
    const me = u({ id: "me", priorityBoost: 0 });
    const other = u({ id: "o", priorityBoost: 10 });
    expect(isAhead(other, me)).toBe(true);
    expect(isAhead(me, other)).toBe(false);
  });

  it("breaks ties by earlier createdAt", () => {
    const earlier = u({ id: "e", createdAt: new Date("2026-01-01T00:00:00Z") });
    const later = u({ id: "l", createdAt: new Date("2026-02-01T00:00:00Z") });
    expect(isAhead(earlier, later)).toBe(true);
    expect(isAhead(later, earlier)).toBe(false);
  });

  it("is not ahead of itself", () => {
    const me = u({ id: "me" });
    expect(isAhead(me, me)).toBe(false);
  });
});

describe("queuePosition", () => {
  it("is 1 for the only verified user", () => {
    const me = u({ id: "me" });
    expect(queuePosition(me, [me])).toBe(1);
  });

  it("counts only eligible users ahead, +1", () => {
    const me = u({ id: "me", priorityBoost: 0, createdAt: new Date("2026-03-01T00:00:00Z") });
    const ahead1 = u({ id: "a1", priorityBoost: 5 });
    const ahead2 = u({ id: "a2", priorityBoost: 0, createdAt: new Date("2026-01-01T00:00:00Z") });
    const behind = u({ id: "b", priorityBoost: 0, createdAt: new Date("2026-06-01T00:00:00Z") });
    const unverified = u({ id: "uv", priorityBoost: 99, emailVerified: null });
    const deleted = u({ id: "d", priorityBoost: 99, deletedAt: new Date() });
    expect(queuePosition(me, [me, ahead1, ahead2, behind, unverified, deleted])).toBe(3);
  });

  it("a referral boost moves a user up", () => {
    const a = u({ id: "a", priorityBoost: 0, createdAt: new Date("2026-01-01T00:00:00Z") });
    const b = u({ id: "b", priorityBoost: 0, createdAt: new Date("2026-02-01T00:00:00Z") });
    expect(queuePosition(b, [a, b])).toBe(2);
    const boostedB = { ...b, priorityBoost: 10 };
    expect(queuePosition(boostedB, [a, boostedB])).toBe(1);
  });

  it("returns null for a user not eligible for the queue", () => {
    const me = u({ id: "me", emailVerified: null });
    expect(queuePosition(me, [me])).toBeNull();
  });
});
