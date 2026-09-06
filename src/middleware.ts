import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Three jobs, in order:
 *   1. refresh the Supabase auth cookie on every request that could need it
 *   2. bounce unauthenticated /admin/* to the login page
 *   3. mint a per-request CSP nonce
 *
 * (2) is a redirect for humans, NOT the authorisation boundary. A server action
 * is a public HTTP endpoint reachable without passing through here, which is why
 * every action calls requireSession() itself.
 */

const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

function csp(nonce: string | null) {
  // React's dev build uses eval() for cross-environment stack reconstruction.
  // Never emitted in a production build.
  const dev = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
  const script =
    (nonce ? `'self' 'nonce-${nonce}' 'strict-dynamic'` : "'self' 'unsafe-inline'") + dev;
  return [
    "default-src 'self'",
    `script-src ${script}`,
    // Tailwind v4 and the motion system write inline custom properties by design.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${SUPABASE_HOST}`,
    `media-src 'self' blob: ${SUPABASE_HOST}`,
    `connect-src 'self' ${SUPABASE_HOST}`,
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

export async function middleware(request: NextRequest) {
  const isAdmin = request.nextUrl.pathname.startsWith("/admin");
  const isLogin = request.nextUrl.pathname === "/admin/login";

  /*
   * PUBLIC ROUTES NEVER TOUCH SUPABASE.
   *
   * This is not an optimisation, it is the failure-mode decision from spec §2.
   * `content.ts` falls back to `defaults.ts` on any error precisely so that
   * Supabase being down cannot blank the site. Refreshing a session here would
   * throw on every public page the moment Supabase is unreachable — turning a
   * gracefully-degrading site into a site-wide 500, which is strictly worse than
   * the outcome the fallback was built to prevent. The public site is anonymous;
   * it has no session to refresh.
   *
   * Verified: with no credentials configured, calling updateSession() here made
   * `/`, `/services`, `/projects` and `/about` all return 500.
   */
  if (!isAdmin) {
    const res = NextResponse.next();
    res.headers.set("content-security-policy", csp(null));
    return res;
  }

  // Only /admin gets a nonce; the public site renders an inline JSON-LD script
  // and Next's boot code, which a strict nonce policy would block.
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const policy = csp(nonce);

  // Set these BEFORE updateSession: it calls NextResponse.next({ request }),
  // which snapshots the request headers. Setting the nonce afterwards would
  // leave it out of the copy Next reads when stamping its own <script> tags.
  request.headers.set("x-nonce", nonce);
  request.headers.set("content-security-policy", policy);

  let response: NextResponse;
  let user: Awaited<ReturnType<typeof updateSession>>["user"] = null;

  try {
    ({ response, user } = await updateSession(request));
  } catch (err) {
    // Supabase unreachable. Fail CLOSED for admin — but degrade to the login
    // page rather than a 500, and never bounce the login page to itself.
    console.error("[middleware] session refresh failed:", err);
    if (isLogin) {
      const res = NextResponse.next({ request });
      res.headers.set("content-security-policy", policy);
      return res;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    const redirect = NextResponse.redirect(url);
    redirect.headers.set("content-security-policy", policy);
    return redirect;
  }

  if (!user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    const redirect = NextResponse.redirect(url);
    // Carry the refreshed auth cookies onto the redirect, or the next request
    // arrives with a stale session and bounces again.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    redirect.headers.set("content-security-policy", policy);
    return redirect;
  }

  if (user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    redirect.headers.set("content-security-policy", policy);
    return redirect;
  }

  response.headers.set("content-security-policy", policy);
  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and image files.
    "/((?!_next/static|_next/image|favicon.ico|images|videos|logos|.*\.(?:png|jpg|jpeg|webp|mp4|svg|ico)$).*)",
  ],
};
