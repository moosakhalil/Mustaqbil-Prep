import { z } from "zod";
import { db } from "@/db";
import { militaryPattern } from "@/db/schema";
import { MILITARY_COURSES } from "@/lib/military";
import { adminOnly, fail, isResponse, json, readJson } from "@/lib/server/api";

const n = (max: number) => z.number().int().min(0).max(max);
const body = z.object({
  course: z.enum(MILITARY_COURSES.map((c) => c.id) as [string, ...string[]]),
  verbalCount: n(500), verbalMinutes: n(600),
  nonverbalCount: n(500), nonverbalMinutes: n(600),
  academicCount: n(500), academicMinutes: n(600),
});

// Owner only: the real section counts and times of one course's initial test. Zero means "not set yet".
export async function PUT(req: Request) {
  const who = await adminOnly(req);
  if (isResponse(who)) return who;
  const parsed = body.safeParse(await readJson(req, 2_000));
  if (!parsed.success) return fail("Counts must be 0 to 500 and minutes 0 to 600");
  const { course, ...values } = parsed.data;
  await db
    .insert(militaryPattern)
    .values({ course, ...values })
    .onConflictDoUpdate({ target: militaryPattern.course, set: { ...values, updatedAt: new Date() } });
  return json({ ok: true });
}
