import { tombstoneEmail, buildSoftDelete, buildExport } from "@/lib/account/gdpr";

describe("tombstoneEmail", () => {
  it("derives a unique, non-routable tombstone from the user id", () => {
    expect(tombstoneEmail("abc123")).toBe("deleted+abc123@deleted.invalid");
  });
});

describe("buildSoftDelete", () => {
  it("marks deletion and scrubs identifying fields without hard-deleting", () => {
    const now = new Date("2026-06-27T12:00:00Z");
    const update = buildSoftDelete("abc123", now);
    expect(update.deletedAt).toBe(now);
    expect(update.email).toBe("deleted+abc123@deleted.invalid");
    expect(update.name).toBe("");
    expect(update.reason).toBeNull();
    expect(update.consentIp).toBeNull();
    expect(update.consentUA).toBeNull();
  });
});

describe("buildExport", () => {
  it("produces a JSON-serializable snapshot of the user's own data", () => {
    const user = {
      id: "u1",
      name: "Alberto",
      email: "a@example.com",
      reason: "accused of AI",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      emailVerified: new Date("2026-01-02T00:00:00Z"),
      referralCode: "ref1",
      priorityBoost: 20,
      consentGdpr: true,
      consentTerms: true,
      consentPrivacy: true,
      consentAt: new Date("2026-01-01T00:00:00Z"),
    };
    const feedback = [{ body: "great", tag: "UX", createdAt: new Date("2026-02-01T00:00:00Z") }];
    const out = buildExport(user, feedback);
    // must round-trip through JSON
    const round = JSON.parse(JSON.stringify(out));
    expect(round.profile.email).toBe("a@example.com");
    expect(round.profile.referralCode).toBe("ref1");
    expect(round.consent.gdpr).toBe(true);
    expect(round.feedback).toHaveLength(1);
    expect(round.feedback[0].body).toBe("great");
  });
});
