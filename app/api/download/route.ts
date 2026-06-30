import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { getDownloadStateForUser } from "@/lib/release/store";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const state = await getDownloadStateForUser(user.id);
  if (!state.available || !state.url) {
    return NextResponse.json({ error: "Download not available yet" }, { status: 403 });
  }
  return NextResponse.redirect(state.url, 302);
}
