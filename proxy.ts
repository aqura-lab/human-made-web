import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Edge middleware: cheap signature check only (no DB). Fresh-data authorization
// (e.g. account deleted mid-session) is re-checked in route handlers / pages.

const SESSION_COOKIE = "hm_session";

export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*", "/admin/:path*"],
};

async function readClaims(req: NextRequest): Promise<{ isAdmin: boolean } | null> {
  const jwt = req.cookies.get(SESSION_COOKIE)?.value;
  if (!jwt) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(jwt, new TextEncoder().encode(secret));
    return { isAdmin: payload.isAdmin === true };
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const claims = await readClaims(req);
  const { pathname } = req.nextUrl;

  if (!claims) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && !claims.isAdmin) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
