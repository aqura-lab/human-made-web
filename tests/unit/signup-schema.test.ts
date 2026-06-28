import { signupSchema } from "@/lib/validation/schemas";

const valid = {
  name: "Alberto",
  email: "Alberto@Example.com",
  reason: "I get accused of using AI",
  consentGdpr: true,
  consentTerms: true,
  consentPrivacy: true,
  ref: "abc123",
};

describe("signupSchema", () => {
  it("accepts a fully-consented signup and lowercases the email", () => {
    const r = signupSchema.parse(valid);
    expect(r.email).toBe("alberto@example.com");
    expect(r.name).toBe("Alberto");
  });

  it.each(["consentGdpr", "consentTerms", "consentPrivacy"] as const)(
    "rejects when %s is not true",
    (field) => {
      const r = signupSchema.safeParse({ ...valid, [field]: false });
      expect(r.success).toBe(false);
    },
  );

  it("requires a name and a valid email", () => {
    expect(signupSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("treats reason and ref as optional", () => {
    const { reason, ref, ...rest } = valid;
    void reason;
    void ref;
    expect(signupSchema.safeParse(rest).success).toBe(true);
  });

  it("trims whitespace from the name", () => {
    expect(signupSchema.parse({ ...valid, name: "  Alberto  " }).name).toBe("Alberto");
  });
});
