import { planVerification } from "@/lib/auth/verify-plan";

describe("planVerification", () => {
  it("verifies a first-time user and bumps their referrer", () => {
    expect(planVerification({ emailVerified: null, referredById: "ref-1" })).toEqual({
      setVerified: true,
      bumpReferrerId: "ref-1",
    });
  });

  it("verifies a first-time user with no referrer", () => {
    expect(planVerification({ emailVerified: null, referredById: null })).toEqual({
      setVerified: true,
      bumpReferrerId: null,
    });
  });

  it("does not re-verify or double-bump an already-verified user", () => {
    expect(
      planVerification({ emailVerified: new Date("2026-01-01"), referredById: "ref-1" }),
    ).toEqual({ setVerified: false, bumpReferrerId: null });
  });
});
