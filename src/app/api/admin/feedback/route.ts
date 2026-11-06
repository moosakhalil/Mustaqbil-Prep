import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { adminOnly, fail, isResponse, json, readJson } from "@/lib/server/api";

const body = z.object({ id: z.string().min(1).max(80), status: z.enum(["new", "done"]) });

// Owner only: mark a message done (or new again).
export async function PATCH(req: Request) {
  const who = await adminOnly(req);
  if (isResponse(who)) return who;
  const parsed = body.safeParse(await readJson(req, 1_000));
  if (!parsed.success) return fail("Bad request");
  await db.update(feedback).set({ status: parsed.data.status }).where(eq(feedback.id, parsed.data.id));
  return json({ ok: true });
}
