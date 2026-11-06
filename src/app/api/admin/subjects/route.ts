import { and, asc, eq, max } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { militarySubject } from "@/db/schema";
import { newId } from "@/lib/id";
import { manifest } from "@/lib/manifest";
import { MILITARY_COURSES } from "@/lib/military";
import { bankById } from "@/lib/military-data";
import { adminOnly, fail, isResponse, json, readJson } from "@/lib/server/api";

const courseId = z.enum(MILITARY_COURSES.map((c) => c.id) as [string, ...string[]]);

const create = z.object({
  course: courseId,
  title: z.string().trim().min(1).max(80),
  source: z.enum(["degree", "military"]),
  degreeCourse: z.string().max(40).optional(),
  units: z.array(z.number().int().min(0).max(1000)).max(200).nullable().optional(),
  militaryFile: z.string().max(80).optional(),
});

// Owner only: add an Academic subject to a military course, from a degree bank (by reference, whole bank or chosen chapters)
// or from converted military material.
export async function POST(req: Request) {
  const who = await adminOnly(req);
  if (isResponse(who)) return who;
  const parsed = create.safeParse(await readJson(req, 20_000));
  if (!parsed.success) return fail("Please check the subject details");
  const b = parsed.data;

  let units: number[] | null = null;
  if (b.source === "degree") {
    const course = manifest.courses.find((c) => c.id === b.degreeCourse);
    if (!course) return fail("Unknown degree course");
    if (b.units && b.units.length > 0) {
      const valid = new Set(course.units.map((u) => u.n));
      if (!b.units.every((u) => valid.has(u))) return fail("Unknown chapter");
      units = [...new Set(b.units)].sort((x, y) => x - y);
      if (units.length === course.units.length) units = null; // every chapter = the whole bank
    }
  } else {
    const bank = b.militaryFile ? bankById(b.militaryFile) : undefined;
    if (!bank || bank.section !== "academic" || bank.course !== b.course) return fail("That military file is not an Academic file of this course");
  }

  const [{ top }] = await db.select({ top: max(militarySubject.position) }).from(militarySubject).where(eq(militarySubject.course, b.course));
  const id = newId();
  await db.insert(militarySubject).values({
    id, course: b.course, title: b.title, position: (top ?? -1) + 1, source: b.source,
    degreeCourse: b.source === "degree" ? b.degreeCourse! : null, units, militaryFile: b.source === "military" ? b.militaryFile! : null,
  });
  return json({ id }, 201);
}

const change = z.object({ id: z.string().min(1).max(80), title: z.string().trim().min(1).max(80).optional(), move: z.enum(["up", "down"]).optional() });

// Rename a subject, or move it up or down in its course.
export async function PATCH(req: Request) {
  const who = await adminOnly(req);
  if (isResponse(who)) return who;
  const parsed = change.safeParse(await readJson(req, 2_000));
  if (!parsed.success) return fail("Bad request");
  const { id, title, move } = parsed.data;

  const rows = await db.select().from(militarySubject).where(eq(militarySubject.id, id)).limit(1);
  const subject = rows[0];
  if (!subject) return fail("Not found", 404);

  if (title) await db.update(militarySubject).set({ title }).where(eq(militarySubject.id, id));

  if (move) {
    const list = await db.select({ id: militarySubject.id }).from(militarySubject).where(eq(militarySubject.course, subject.course)).orderBy(asc(militarySubject.position), asc(militarySubject.createdAt));
    const i = list.findIndex((s) => s.id === id);
    const j = move === "up" ? i - 1 : i + 1;
    if (i >= 0 && j >= 0 && j < list.length) {
      [list[i], list[j]] = [list[j], list[i]];
      // write the new order as positions 0, 1, 2 ...
      await db.transaction(async (tx) => {
        for (let k = 0; k < list.length; k++) await tx.update(militarySubject).set({ position: k }).where(eq(militarySubject.id, list[k].id));
      });
    }
  }
  return json({ ok: true });
}

export async function DELETE(req: Request) {
  const who = await adminOnly(req);
  if (isResponse(who)) return who;
  const parsed = z.object({ id: z.string().min(1).max(80) }).safeParse(await readJson(req, 1_000));
  if (!parsed.success) return fail("Bad request");
  await db.delete(militarySubject).where(and(eq(militarySubject.id, parsed.data.id)));
  return json({ ok: true });
}
