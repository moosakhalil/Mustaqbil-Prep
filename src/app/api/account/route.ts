import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { user } from "@/db/schema";
import { authed, fail, isResponse, json, readJson } from "@/lib/server/api";

const body = z.object({ confirm: z.literal("DELETE") });

// Delete my account and everything I saved (sessions, results, notebook, bookmarks, reports are removed with the user row).
export async function DELETE(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  if (!body.safeParse(await readJson(req, 1_000)).success) return fail("Confirmation missing");
  await db.delete(user).where(eq(user.id, who.userId));
  return json({ ok: true });
}
