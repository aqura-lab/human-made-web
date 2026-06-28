import { signSession, verifySession, type SessionClaims } from "@/lib/auth/session";

const secret = "test-secret-at-least-32-bytes-long-xxxxx";
const claims: Omit<SessionClaims, "iat" | "exp"> = {
  sub: "user-123",
  email: "alberto@example.com",
  isAdmin: true,
};

describe("session JWT", () => {
  it("round-trips a signed session", async () => {
    const jwt = await signSession(claims, secret);
    const out = await verifySession(jwt, secret);
    expect(out?.sub).toBe("user-123");
    expect(out?.email).toBe("alberto@example.com");
    expect(out?.isAdmin).toBe(true);
  });

  it("rejects a token signed with a different secret", async () => {
    const jwt = await signSession(claims, secret);
    expect(await verifySession(jwt, "a-completely-different-secret-32bytes!!")).toBeNull();
  });

  it("rejects a tampered token", async () => {
    const jwt = await signSession(claims, secret);
    const tampered = jwt.slice(0, -3) + (jwt.endsWith("aaa") ? "bbb" : "aaa");
    expect(await verifySession(tampered, secret)).toBeNull();
  });

  it("rejects an already-expired token", async () => {
    const jwt = await signSession(claims, secret, "-1s");
    expect(await verifySession(jwt, secret)).toBeNull();
  });
});
