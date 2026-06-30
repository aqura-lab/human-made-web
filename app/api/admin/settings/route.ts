import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, isAdmin } from "@/lib/auth/guards";
import { setSetting } from "@/lib/settings/store";

export const runtime = "nodejs";

const Body = z.object({ key: z.string().min(1).max(80), value: z.string().max(2000) });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const parsed = Body.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid setting" }, { status: 400 });
  await setSetting(parsed.data.key, parsed.data.value);
  return NextResponse.json({ ok: true });
}
