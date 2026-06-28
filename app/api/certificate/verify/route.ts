import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyCertificate, CertificateFormatError } from "@/lib/verify/service";

// Crypto (noble) runs in Node, not Edge. Stateless — no DB, no persistence.
export const runtime = "nodejs";

const Body = z.object({
  raw: z.string().min(1).max(256_000),
  expectedText: z.string().max(5_000_000).optional(),
});

export async function POST(request: Request) {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body = Body.safeParse(parsed);
  if (!body.success) {
    return NextResponse.json({ error: "Paste a certificate to verify" }, { status: 400 });
  }

  try {
    // Never log body.data.raw or expectedText — privacy invariant.
    const result = verifyCertificate(body.data.raw, body.data.expectedText);
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    if (e instanceof CertificateFormatError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
