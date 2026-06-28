import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { getPublicIdeas } from "@/lib/community/board";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const ideas = await getPublicIdeas(user.id);
  return NextResponse.json({ ideas });
}
