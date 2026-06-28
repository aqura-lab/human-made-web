import {
  generateReferralCode,
  isSelfReferral,
  wouldCreateCycle,
} from "@/lib/referral/attribution";

describe("generateReferralCode", () => {
  it("produces a non-empty url-safe code", () => {
    const code = generateReferralCode();
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(code.length).toBeGreaterThanOrEqual(8);
  });

  it("produces distinct codes", () => {
    expect(generateReferralCode()).not.toBe(generateReferralCode());
  });
});

describe("isSelfReferral", () => {
  it("detects a user referring their own email, case/space-insensitively", () => {
    expect(isSelfReferral("Alberto@Example.com", " alberto@example.com ")).toBe(true);
    expect(isSelfReferral("a@example.com", "b@example.com")).toBe(false);
  });
});

describe("wouldCreateCycle", () => {
  // ancestorEmails/ids of the proposed referrer, walking up referredBy.
  it("rejects when the new user already appears in the referrer's ancestry", () => {
    expect(wouldCreateCycle("user-1", ["user-3", "user-2", "user-1"])).toBe(true);
  });

  it("allows an acyclic attribution", () => {
    expect(wouldCreateCycle("user-1", ["user-3", "user-2"])).toBe(false);
  });

  it("allows when ancestry is empty", () => {
    expect(wouldCreateCycle("user-1", [])).toBe(false);
  });
});
