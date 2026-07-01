import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation/schemas";
import { verifyPassword } from "@/lib/auth/password";
import { isLocked, nextFailureState, resetState } from "@/lib/auth/lockout";
import { setSessionCookie } from "@/lib/auth/session";
import { isAdminEmail, adminEmails } from "@/lib/auth/admin";
import { issueMagicLink } from "@/lib/auth/magic";

export const runtime = "nodejs";

// Identical for every credential failure — no account enumeration.
const INVALID = { error: "Invalid email or password." };

// A well-formed scrypt hash that no real password matches. Verified against in
// the no-user / no-password branches so those paths spend the same time as a
// genuine verify (defeats timing-based enumeration).
const DUMMY_HASH =
  "scrypt$16384$8$1$00000000000000000000000000000000$" +
  "0".repeat(128);

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(INVALID, { status: 401 });
  }
  const { email, password } = parsed.data;
  const now = new Date();

  const user = await prisma.user.findUnique({ where: { email } });

  // No account, soft-deleted, or password never set → uniform failure, but still
  // burn a scrypt to keep timing indistinguishable from a real verify.
  if (!user || user.deletedAt || !user.passwordHash) {
    await verifyPassword(password, DUMMY_HASH);
    return NextResponse.json(INVALID, { status: 401 });
  }

  if (isLocked(user, now)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429 },
    );
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    await prisma.user.update({
      where: { id: user.id },
      data: nextFailureState(user.failedLoginCount, now),
    });
    return NextResponse.json(INVALID, { status: 401 });
  }

  // Correct password but email not yet confirmed — double opt-in stays. Don't
  // create a session; send a fresh confirmation link.
  if (!user.emailVerified) {
    await issueMagicLink(user.id, user.email);
    return NextResponse.json(
      { error: "Please confirm your email first — we've sent you a fresh link.", needsVerification: true },
      { status: 403 },
    );
  }

  await prisma.user.update({ where: { id: user.id }, data: resetState() });
  await setSessionCookie({
    sub: user.id,
    email: user.email,
    isAdmin: isAdminEmail(user.email, adminEmails()),
  });
  return NextResponse.json({ ok: true });
}
