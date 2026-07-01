import { hashPassword, verifyPassword, validatePassword } from "@/lib/auth/password";

describe("validatePassword", () => {
  it("enforces a 10..200 character length", () => {
    expect(validatePassword("123456789").ok).toBe(false); // 9
    expect(validatePassword("1234567890").ok).toBe(true); // 10
    expect(validatePassword("a".repeat(200)).ok).toBe(true);
    expect(validatePassword("a".repeat(201)).ok).toBe(false);
  });
});

describe("hashPassword / verifyPassword", () => {
  it("round-trips and rejects wrong passwords", async () => {
    const enc = await hashPassword("correct horse battery staple");
    expect(enc.startsWith("scrypt$")).toBe(true);
    expect(enc).not.toContain("correct horse"); // never stores the plaintext
    expect(await verifyPassword("correct horse battery staple", enc)).toBe(true);
    expect(await verifyPassword("wrong password entirely", enc)).toBe(false);
  });

  it("uses a random salt (same password -> different encodings)", async () => {
    const a = await hashPassword("same password value");
    const b = await hashPassword("same password value");
    expect(a).not.toBe(b);
    expect(await verifyPassword("same password value", a)).toBe(true);
    expect(await verifyPassword("same password value", b)).toBe(true);
  });

  it("returns false (never throws) on malformed encoded input", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
    expect(await verifyPassword("x", "scrypt$16384$8$1$deadbeef")).toBe(false); // missing hash segment
    expect(await verifyPassword("x", "bcrypt$1$2$3$aa$bb")).toBe(false); // wrong algorithm tag
  });
});
