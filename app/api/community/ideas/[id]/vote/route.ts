import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guards";
import { isVotableIdea } from "@/lib/community/ideas";

export const runtime = "nodejs";

async function assertVotable(id: string): Promise<boolean> {
  const f = await prisma.feedback.findUnique({ where: { id }, select: { public: true, status: true } });
  return !!f && isVotableIdea(f);
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  if (!(await assertVotable(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Idempotent: unique([feedbackId,userId]) makes a duplicate a no-op.
  await prisma.feedbackVote.upsert({
    where: { feedbackId_userId: { feedbackId: id, userId: user.id } },
    create: { feedbackId: id, userId: user.id },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  await prisma.feedbackVote.deleteMany({ where: { feedbackId: id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
