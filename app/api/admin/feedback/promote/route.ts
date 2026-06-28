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
  if (isPublic && !publicTitle?.trim()) {
    return NextResponse.json(
      { error: "A public title is required to promote an idea." },
      { status: 400 },
    );
  }
  try {
    await prisma.feedback.update({
      where: { id },
      data: {
        public: isPublic,
        publicTitle: isPublic ? (publicTitle ?? null) : null,
        promotedAt: isPublic ? new Date() : null,
      },
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }
    throw e;
  }
  return NextResponse.json({ ok: true });
}
