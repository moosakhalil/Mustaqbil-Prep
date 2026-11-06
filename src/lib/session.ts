import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Every protected page and route re-checks the session here.
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

// The owner is the verified Google account named in ADMIN_EMAIL.
export function isAdmin(user: { email: string; emailVerified: boolean }) {
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return !!admin && user.emailVerified && user.email.toLowerCase() === admin;
}
