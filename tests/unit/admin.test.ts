import { isAdminEmail, parseAdminEmails } from "@/lib/auth/admin";

describe("parseAdminEmails", () => {
  it("splits, trims and lowercases a comma-separated list", () => {
    expect(parseAdminEmails(" Alberto@AQura.com , b@x.com ")).toEqual([
      "alberto@aqura.com",
      "b@x.com",
    ]);
  });

  it("returns an empty list for undefined or empty input", () => {
    expect(parseAdminEmails(undefined)).toEqual([]);
    expect(parseAdminEmails("")).toEqual([]);
  });
});

describe("isAdminEmail", () => {
  const allow = ["alberto@aqurastudio.com"];

  it("matches case- and whitespace-insensitively", () => {
    expect(isAdminEmail("  Alberto@AquraStudio.com ", allow)).toBe(true);
  });

  it("rejects a non-listed email", () => {
    expect(isAdminEmail("intruder@example.com", allow)).toBe(false);
  });

  it("rejects when the allowlist is empty", () => {
    expect(isAdminEmail("alberto@aqurastudio.com", [])).toBe(false);
  });
});
