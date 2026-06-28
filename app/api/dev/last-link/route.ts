import { NextResponse } from "next/server";
import { getLastDevLink } from "@/lib/auth/email";

export const runtime = "nodejs";

// DEV/TEST ONLY: surfaces the most recent magic link for an email so end-to-end
// tests (and local dev) can complete the passwordless flow without a real inbox.
// Hard-disabled in production.
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const email = new URL(request.url).searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
  return NextResponse.json({ url: getLastDevLink(email) });
}
