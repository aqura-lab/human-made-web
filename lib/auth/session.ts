import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Session = a short JWT in an httpOnly cookie. The cookie is checked cheaply in
// middleware (signature only, no DB). Authorization needing fresh data is
// re-checked in route handlers via requireUser/requireAdmin.

export const SESSION_COOKIE = "hm_session";
const DEFAULT_TTL = "30d";

export type SessionClaims = {
  sub: string;
  email: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
};

function key(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signSession(
  claims: { sub: string; email: string; isAdmin: boolean },
  secret: string,
  ttl: string = DEFAULT_TTL,
): Promise<string> {
  return new SignJWT({ email: claims.email, isAdmin: claims.isAdmin })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(key(secret));
}

export async function verifySession(
  jwt: string,
  secret: string,
): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(jwt, key(secret));
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      isAdmin: payload.isAdmin === true,
      iat: Number(payload.iat),
      exp: Number(payload.exp),
    };
  } catch {
    return null;
  }
}

function secretFromEnv(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error("JWT_SECRET is not configured");
  return s;
}

/** Set the session cookie (call from a route handler / server action). */
export async function setSessionCookie(claims: {
  sub: string;
  email: string;
  isAdmin: boolean;
}): Promise<void> {
  const jwt = await signSession(claims, secretFromEnv());
  const store = await cookies();
  store.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Read + verify the current session from the cookie, or null. */
export async function readSession(): Promise<SessionClaims | null> {
  const store = await cookies();
  const jwt = store.get(SESSION_COOKIE)?.value;
  if (!jwt) return null;
  return verifySession(jwt, secretFromEnv());
}
