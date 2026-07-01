import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { publishCertificateSchema } from "@/lib/validation/schemas";
import { preparePublish } from "@/lib/certificate/publish";
import { publishCertificate } from "@/lib/certificate/store";

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

  const parsed = publishCertificateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a certificate (and a valid article URL, if any)." }, { status: 400 });
  }

  const prepared = preparePublish(parsed.data.json);
  if (!prepared.ok) {
    return NextResponse.json({ error: prepared.error }, { status: 400 });
  }

  const result = await publishCertificate({
    userId: user.id,
    certId: prepared.certId,
    signedJson: parsed.data.json,
    articleUrl: parsed.data.articleUrl ?? null,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: "That certificate has already been published by another account." },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true, id: prepared.certId, url: `/c/${prepared.certId}` });
}
