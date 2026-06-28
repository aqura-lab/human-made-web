// Pure referral-progress logic. A referral "converts" only when the referred
// user verifies their email (and hasn't deleted their account). Progress is
// private to the inviter — no other user's numbers are ever derived here.

export type ReferredUser = {
  emailVerified: Date | null;
  deletedAt: Date | null;
};

export type ReferralProgress = {
  converted: number;
  goal: number;
  perkUnlocked: boolean;
};

export function countConvertedReferrals(referrals: ReferredUser[]): number {
  return referrals.filter((r) => r.emailVerified !== null && r.deletedAt === null).length;
}

export function referralProgress(converted: number, goal: number): ReferralProgress {
  return { converted, goal, perkUnlocked: converted >= goal };
}
