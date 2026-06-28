import {
  countConvertedReferrals,
  referralProgress,
  type ReferredUser,
} from "@/lib/referral/progress";

function r(p: Partial<ReferredUser> = {}): ReferredUser {
  return { emailVerified: new Date("2026-01-01T00:00:00Z"), deletedAt: null, ...p };
}

describe("countConvertedReferrals", () => {
  it("counts only verified, non-deleted referrals", () => {
    const referrals = [
      r(),
      r(),
      r({ emailVerified: null }), // signed up but never verified
      r({ deletedAt: new Date() }), // deleted account
    ];
    expect(countConvertedReferrals(referrals)).toBe(2);
  });

  it("is 0 for no referrals", () => {
    expect(countConvertedReferrals([])).toBe(0);
  });
});

describe("referralProgress", () => {
  it("reports progress below goal without unlocking the perk", () => {
    expect(referralProgress(3, 5)).toEqual({ converted: 3, goal: 5, perkUnlocked: false });
  });

  it("unlocks the perk at the goal", () => {
    expect(referralProgress(5, 5)).toEqual({ converted: 5, goal: 5, perkUnlocked: true });
  });

  it("stays unlocked above the goal", () => {
    expect(referralProgress(7, 5)).toEqual({ converted: 7, goal: 5, perkUnlocked: true });
  });
});
