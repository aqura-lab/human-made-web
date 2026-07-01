import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, isAdmin } from "@/lib/auth/guards";
import { createRelease, getCurrentRelease } from "@/lib/release/store";

export const runtime = "nodejs";

const Body = z.object({
  version: z.string().trim().min(1).max(40),
  fileName: z.string().trim().min(1).max(200),
  blobUrl: z.string().url(),
  sizeBytes: z.number().int().positive().optional(),
  sha256: z.string().trim().max(128).optional(),
  notes: z.string().trim().max(20000).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ release: await getCurrentRelease() });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const parsed = Body.safeParse(payload);
  if (!parsed.success) {
    // Admin-only route — surface the specific validation failure to aid debugging.
    const issue = parsed.error.issues[0];
    const detail = issue ? `${issue.path.join(".")}: ${issue.message}` : "invalid payload";
    return NextResponse.json({ error: `Invalid release (${detail})` }, { status: 400 });
  }
  const release = await createRelease(parsed.data);
  return NextResponse.json({ ok: true, release });
}
