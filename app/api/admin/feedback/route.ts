import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth/guards";

export const runtime = "nodejs";

const Body = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "REVIEWED", "HIDDEN"]),
});

export async function PATCH(request: Request) {
  // Re-check admin server-side — never trust the cookie claim alone for a mutation.
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = Body.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid moderation request" }, { status: 400 });
  }

  await prisma.feedback.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });
  return NextResponse.json({ ok: true });
}
