import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { guideRead } from "@/db/schema";
import { isLessonKey } from "@/lib/guide";
import { authed, fail, isResponse, json, readJson } from "@/lib/server/api";

// The Study guide lessons this student has marked as read.
const body = z.object({ lessonKey: z.string().min(1).max(80) });

export async function GET(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const rows = await db.select({ key: guideRead.lessonKey }).from(guideRead).where(eq(guideRead.userId, who.userId));
  return json({ ids: rows.map((r) => r.key) });
}

export async function POST(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const parsed = body.safeParse(await readJson(req, 2_000));
  if (!parsed.success || !isLessonKey(parsed.data.lessonKey)) return fail("Bad request");
  await db.insert(guideRead).values({ userId: who.userId, lessonKey: parsed.data.lessonKey }).onConflictDoNothing();
  return json({ ok: true }, 201);
}

export async function DELETE(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const parsed = body.safeParse(await readJson(req, 2_000));
  if (!parsed.success) return fail("Bad request");
  await db.delete(guideRead).where(and(eq(guideRead.userId, who.userId), eq(guideRead.lessonKey, parsed.data.lessonKey)));
  return json({ ok: true });
}
