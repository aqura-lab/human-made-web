import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const GRACE_DAYS = 30;

// Hard-purges soft-deleted users after the grace period. Protected by
// CRON_SECRET so only Vercel Cron (or an authorized caller) can trigger it.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000);
  const { count } = await prisma.user.deleteMany({
    where: { deletedAt: { not: null, lt: cutoff } },
  });
  return NextResponse.json({ ok: true, purged: count });
}
