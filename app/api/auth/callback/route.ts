import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken, isTokenUsable } from "@/lib/auth/token";
import { planVerification } from "@/lib/auth/verify-plan";
import { setSessionCookie } from "@/lib/auth/session";
import { isAdminEmail, adminEmails } from "@/lib/auth/admin";
import { appUrl } from "@/lib/auth/magic";

export const runtime = "nodejs";

function boost(): number {
  return Number(process.env.REFERRAL_BOOST_PER_CONVERSION ?? "10");
}

function redirect(path: string) {
  return NextResponse.redirect(new URL(path, appUrl()));
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("token");
  if (!raw) return redirect("/login?error=missing");

  const token = await prisma.magicLinkToken.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: { user: true },
  });

  const now = new Date();
  if (!token || !isTokenUsable(token, now)) {
    return redirect("/login?error=expired");
  }

  const user = token.user;
  const plan = planVerification(user);

  await prisma.$transaction(async (tx) => {
    await tx.magicLinkToken.update({ where: { id: token.id }, data: { usedAt: now } });
    if (plan.setVerified) {
      await tx.user.update({ where: { id: user.id }, data: { emailVerified: now } });
    }
    if (plan.bumpReferrerId) {
      await tx.user.update({
        where: { id: plan.bumpReferrerId },
        data: { priorityBoost: { increment: boost() } },
      });
    }
  });

  await setSessionCookie({
    sub: user.id,
    email: user.email,
    isAdmin: isAdminEmail(user.email, adminEmails()),
  });

  return redirect("/dashboard");
}
