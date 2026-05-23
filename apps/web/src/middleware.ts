import { NextResponse, type NextRequest } from "next/server";

const AUTH_PATHS = new Set(["/login", "/signup", "/verify"]);

/**
 * Soft auth gating based on cookie presence. A stale or revoked cookie
 * still gets through here — the layout's server-side `me()` check is the
 * real gate. Middleware just spares the round-trip when there's clearly
 * no session.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get("helia_session")?.value);
  const isAuthPath = AUTH_PATHS.has(pathname);

  if (!hasSession && !isAuthPath) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasSession && isAuthPath) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|widget.js|widget.css).*)"],
};
