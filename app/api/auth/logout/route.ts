import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";
import { appUrl } from "@/lib/auth/magic";

export const runtime = "nodejs";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/", appUrl()), { status: 303 });
}
