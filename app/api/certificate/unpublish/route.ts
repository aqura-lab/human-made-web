import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { unpublishCertificateSchema } from "@/lib/validation/schemas";
import { unpublishCertificate } from "@/lib/certificate/store";

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

  const parsed = unpublishCertificateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Owner-scoped: only removes a row belonging to this user.
  await unpublishCertificate(user.id, parsed.data.id);
  return NextResponse.json({ ok: true });
}
