import "server-only";
import { NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/session";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

/**
 * The signed-in person for an API route, or a ready 401/403 reply.
 * Changes (POST, PATCH, DELETE) must also come from this site: a request carrying another site's Origin is refused.
 */
export async function authed(req: Request): Promise<{ userId: string; email: string; name: string; emailVerified: boolean } | Response> {
  if (req.method !== "GET" && req.method !== "HEAD") {
    const origin = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (origin && host && new URL(origin).host !== host) return fail("Request not allowed", 403);
  }
  const session = await getSession();
  if (!session) return fail("Sign in first", 401);
  return { userId: session.user.id, email: session.user.email, name: session.user.name, emailVerified: session.user.emailVerified };
}

/** Like authed, but only the owner (the verified Google account named in ADMIN_EMAIL) gets through. */
export async function adminOnly(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  if (!isAdmin({ email: who.email, emailVerified: who.emailVerified })) return fail("Owner only", 403);
  return who;
}

export const isResponse = (x: unknown): x is Response => x instanceof Response;

/** Read a JSON body of limited size. Returns null when it is missing, too big or not JSON. */
export async function readJson(req: Request, maxBytes = 1_500_000): Promise<unknown | null> {
  const text = await req.text();
  if (!text || text.length > maxBytes) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
