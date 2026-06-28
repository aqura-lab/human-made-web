import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requestLinkSchema } from "@/lib/validation/schemas";
import { issueMagicLink } from "@/lib/auth/magic";

export const runtime = "nodejs";

// Always returns the same response so it can't be used to discover who has an
// account. Does not create users — signup is the only creation path.
const GENERIC = { ok: true, message: "If that email is registered, a sign-in link is on its way." };

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = requestLinkSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user && !user.deletedAt) {
    await issueMagicLink(user.id, user.email);
  }
  return NextResponse.json(GENERIC);
}
