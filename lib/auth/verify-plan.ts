// Pure decision for what an email-verification (magic-link callback) should do.
// The referral bump fires exactly once — only when a user transitions from
// unverified to verified — so unverified signups can never inflate a referrer.

export type VerifyPlan = {
  setVerified: boolean;
  bumpReferrerId: string | null;
};

export function planVerification(user: {
  emailVerified: Date | null;
  referredById: string | null;
}): VerifyPlan {
  if (user.emailVerified !== null) {
    return { setVerified: false, bumpReferrerId: null };
  }
  return { setVerified: true, bumpReferrerId: user.referredById };
}
