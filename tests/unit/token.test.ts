import {
  generateToken,
  hashToken,
  tokenExpiry,
  isTokenUsable,
} from "@/lib/auth/token";

describe("generateToken", () => {
  it("returns a url-safe raw token and its sha256 hash", () => {
    const { raw, hash } = generateToken();
    expect(raw).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(raw.length).toBeGreaterThanOrEqual(32);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).toBe(hashToken(raw));
  });

  it("never returns the raw token equal to its stored hash", () => {
    const { raw, hash } = generateToken();
    expect(hash).not.toBe(raw);
  });

  it("produces unique tokens", () => {
    expect(generateToken().raw).not.toBe(generateToken().raw);
  });
});

describe("tokenExpiry", () => {
  it("is 15 minutes after now by default", () => {
    const now = new Date("2026-06-27T12:00:00Z");
    expect(tokenExpiry(now).toISOString()).toBe("2026-06-27T12:15:00.000Z");
  });
});

describe("isTokenUsable", () => {
  const now = new Date("2026-06-27T12:00:00Z");
  const future = new Date("2026-06-27T12:10:00Z");
  const past = new Date("2026-06-27T11:50:00Z");

  it("accepts an unused, unexpired token", () => {
    expect(isTokenUsable({ usedAt: null, expiresAt: future }, now)).toBe(true);
  });

  it("rejects an expired token", () => {
    expect(isTokenUsable({ usedAt: null, expiresAt: past }, now)).toBe(false);
  });

  it("rejects an already-used token", () => {
    expect(isTokenUsable({ usedAt: past, expiresAt: future }, now)).toBe(false);
  });
});
