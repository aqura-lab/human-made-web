import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, isAdmin } from "@/lib/auth/guards";
import { setUserDownloadReleased } from "@/lib/release/store";

export const runtime = "nodejs";

const Body = z.object({ id: z.string().min(1), released: z.boolean() });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const parsed = Body.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  await setUserDownloadReleased(parsed.data.id, parsed.data.released);
  return NextResponse.json({ ok: true });
}
