import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guards";
import { setPasswordSchema } from "@/lib/validation/schemas";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { resetState } from "@/lib/auth/lockout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = setPasswordSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Password must be at least 10 characters." }, { status: 400 });
  }
  const { currentPassword, newPassword } = parsed.data;

  // Changing an existing password requires the current one. Magic-link-only users
  // (no password yet) are already authenticated by their session and may set one.
  if (user.passwordHash) {
    if (!currentPassword || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, ...resetState() },
  });
  return NextResponse.json({ ok: true });
}
