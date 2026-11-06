import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Everyone must sign in: a visitor without a session cookie is sent to the sign-in page.
// This is only a quick first check (is there a cookie?). Every page and API route still checks the real session on the server.
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/sign-in";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Not checked: the API (it answers 401 itself), Next's own files, the sign-in page, the legal pages, the offline page,
  // the service worker and manifest, and static files (pictures, icons, question data, fonts).
  matcher: [
    "/((?!api|_next|sign-in|install|privacy|terms|offline|serwist|icons|art|brand|data|fonts|manifest\\.webmanifest|favicon\\.ico|pdf\\.worker\\.min\\.mjs|.*\\.(?:png|jpg|jpeg|webp|svg|ico|json|txt|js|mjs|css|woff2?)$).*)",
  ],
};
