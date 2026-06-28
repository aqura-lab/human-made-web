import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth/guards";

export const runtime = "nodejs";

const Body = z.object({
  id: z.string().min(1),
  public: z.boolean(),
  publicTitle: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
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
    return NextResponse.json({ error: "Invalid promotion request" }, { status: 400 });
  }
  const { id, public: isPublic, publicTitle } = parsed.data;
  await prisma.feedback.update({
    where: { id },
    data: {
      public: isPublic,
      publicTitle: publicTitle ?? null,
      promotedAt: isPublic ? new Date() : null,
    },
  });
  return NextResponse.json({ ok: true });
}
