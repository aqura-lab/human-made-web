import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signupSchema } from "@/lib/validation/schemas";
import { generateReferralCode, isSelfReferral } from "@/lib/referral/attribution";
import { issueMagicLink } from "@/lib/auth/magic";

export const runtime = "nodejs";

// Always return this so the endpoint can't be used to enumerate who has signed up.
const GENERIC = { ok: true, message: "Check your inbox to confirm your email." };

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please complete all fields and accept the terms." },
      { status: 400 },
    );
  }
  const { name, email, reason, ref } = parsed.data;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ua = request.headers.get("user-agent");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Already signed up — just send a fresh sign-in link. Generic response.
    await issueMagicLink(existing.id, email);
    return NextResponse.json(GENERIC);
  }

  // Resolve referrer (optional). Self-referral is silently dropped.
  let referredById: string | null = null;
  if (ref) {
    const referrer = await prisma.user.findUnique({ where: { referralCode: ref } });
    if (referrer && !isSelfReferral(referrer.email, email)) {
      referredById = referrer.id;
    }
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      reason,
      referralCode: generateReferralCode(),
      referredById,
      consentGdpr: true,
      consentTerms: true,
      consentPrivacy: true,
      consentAt: new Date(),
      consentIp: ip,
      consentUA: ua,
    },
  });

  await issueMagicLink(user.id, email);
  return NextResponse.json(GENERIC);
}
