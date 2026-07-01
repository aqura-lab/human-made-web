import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth/guards";
import { getDownloadStateForUser } from "@/lib/release/store";

export const runtime = "nodejs";

// The release DMG lives in a PRIVATE Blob store, so it is never publicly
// downloadable. This gated route re-checks that the user is released, then
// streams the blob through (small installer; no buffering) — the file is only
// ever served behind this authorization check.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const state = await getDownloadStateForUser(user.id);
  if (!state.available || !state.url) {
    return NextResponse.json({ error: "Download not available yet" }, { status: 403 });
  }

  try {
    const result = await get(state.url, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json({ error: "Release file not found" }, { status: 404 });
    }
    return new Response(result.stream, {
      headers: {
        "content-type": result.blob.contentType || "application/octet-stream",
        "content-disposition": `attachment; filename="Human-Made-${state.version}.dmg"`,
        "content-length": String(result.blob.size),
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not retrieve the release" }, { status: 502 });
  }
}
