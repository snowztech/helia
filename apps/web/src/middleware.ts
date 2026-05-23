import { NextResponse, type NextRequest } from "next/server";

const AUTH_PATHS = new Set(["/login", "/signup", "/verify"]);

/**
 * Soft auth gating. If there's no cookie at all on a protected path, bounce
 * to /login without a round-trip to the API. A stale cookie still gets
 * through — the `(app)` layout's `api.me()` check is the real gate, and
 * has the full session-table truth to act on.
 *
 * The reverse ("logged-in user visits /login → send to /") is intentionally
 * NOT done here. Middleware only sees cookie presence, not validity. If we
 * redirected on presence, a stale cookie would loop against the layout's
 * "no user → /login" redirect.
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|widget.js|widget.css).*)"],
};
