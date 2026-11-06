import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { profile } from "@/db/schema";
import { MILITARY_COURSES } from "@/lib/military";
import { examDateSchema } from "@/lib/ai-focus";
import { authed, fail, isResponse, json, readJson } from "@/lib/server/api";
import { pkDay } from "@/lib/streak";

const body = z
  .object({
    preferredCourse: z.enum(MILITARY_COURSES.map((c) => c.id) as [string, ...string[]]).nullable().optional(),
    examDate: examDateSchema.nullable().optional(),
    freshFirst: z.boolean().optional(),
  })
  .refine((b) => b.preferredCourse !== undefined || b.examDate !== undefined || b.freshFirst !== undefined);

export async function GET(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const rows = await db.select().from(profile).where(eq(profile.userId, who.userId)).limit(1);
  return json({ preferredCourse: rows[0]?.preferredCourse ?? null, examDate: rows[0]?.examDate ?? null, freshFirst: rows[0]?.freshFirst ?? true });
}

export async function PATCH(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const parsed = body.safeParse(await readJson(req, 2_000));
  if (!parsed.success) return fail("Pick one of the four courses, or a valid test date");
  const { preferredCourse, examDate, freshFirst } = parsed.data;
  if (examDate) {
    const today = pkDay(new Date());
    const limit = pkDay(new Date(Date.now() + 800 * 86_400_000));
    if (examDate < today || examDate > limit || Number.isNaN(Date.parse(examDate + "T00:00:00Z"))) return fail("Pick a test date from today to about two years ahead");
  }
  const now = new Date();
  const set: { updatedAt: Date; preferredCourse?: string | null; examDate?: string | null; freshFirst?: boolean } = { updatedAt: now };
  if (preferredCourse !== undefined) set.preferredCourse = preferredCourse;
  if (examDate !== undefined) set.examDate = examDate;
  if (freshFirst !== undefined) set.freshFirst = freshFirst;
  await db
    .insert(profile)
    .values({ userId: who.userId, preferredCourse: preferredCourse ?? null, examDate: examDate ?? null, freshFirst: freshFirst ?? true })
    .onConflictDoUpdate({ target: profile.userId, set });
  return json({ ok: true });
}
