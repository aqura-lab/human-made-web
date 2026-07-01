import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guards";
import { clearSessionCookie } from "@/lib/auth/session";
import { buildSoftDelete } from "@/lib/account/gdpr";

export const runtime = "nodejs";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    // Anonymise feedback (detach from identity) but keep it for product insight.
    await tx.feedback.updateMany({
      where: { userId: user.id },
      data: { userId: null, anonymized: true },
    });
    // Votes are personal data; soft-delete scrubs identity, so remove the user's
    // votes explicitly (FK cascade only fires on the hard purge cron).
    await tx.feedbackVote.deleteMany({ where: { userId: user.id } });
    // Published certificates carry no PII and may be embedded on third-party
    // articles — keep them public but detach from identity (mirrors feedback).
    await tx.certificate.updateMany({ where: { userId: user.id }, data: { userId: null } });
    // Soft-delete: scrub identifying fields, tombstone email, mark deletedAt.
    await tx.user.update({ where: { id: user.id }, data: buildSoftDelete(user.id, now) });
    // Invalidate any outstanding magic links.
    await tx.magicLinkToken.deleteMany({ where: { userId: user.id } });
  });

  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
