import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { bookmark } from "@/db/schema";
import { authed, fail, isResponse, json, readJson } from "@/lib/server/api";

const body = z.object({ questionId: z.string().min(1).max(60) });

export async function GET(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const rows = await db.select({ id: bookmark.questionId }).from(bookmark).where(eq(bookmark.userId, who.userId));
  return json({ ids: rows.map((r) => r.id) });
}

export async function POST(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const parsed = body.safeParse(await readJson(req, 2_000));
  if (!parsed.success) return fail("Bad request");
  await db.insert(bookmark).values({ userId: who.userId, questionId: parsed.data.questionId }).onConflictDoNothing();
  return json({ ok: true }, 201);
}

export async function DELETE(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const parsed = body.safeParse(await readJson(req, 2_000));
  if (!parsed.success) return fail("Bad request");
  await db.delete(bookmark).where(and(eq(bookmark.userId, who.userId), eq(bookmark.questionId, parsed.data.questionId)));
  return json({ ok: true });
}
