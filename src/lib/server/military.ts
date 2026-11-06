import "server-only";
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { attempt, militaryPattern, militarySubject } from "@/db/schema";
import type { SectionId } from "@/lib/military";
import type { SubjectRow } from "@/lib/military-data";
import { NO_PATTERN, type Pattern } from "@/lib/military-pattern";

export async function getSubjects(course: string): Promise<SubjectRow[]> {
  const rows = await db.select().from(militarySubject).where(eq(militarySubject.course, course)).orderBy(asc(militarySubject.position), asc(militarySubject.createdAt));
  return rows.map((r) => ({
    id: r.id, course: r.course, title: r.title, position: r.position, source: r.source === "military" ? "military" : "degree",
    degreeCourse: r.degreeCourse, units: Array.isArray(r.units) ? (r.units as number[]) : null, militaryFile: r.militaryFile,
  }));
}

export async function getPattern(course: string): Promise<Pattern> {
  const rows = await db.select().from(militaryPattern).where(eq(militaryPattern.course, course)).limit(1);
  const r = rows[0];
  return r
    ? { verbalCount: r.verbalCount, verbalMinutes: r.verbalMinutes, nonverbalCount: r.nonverbalCount, nonverbalMinutes: r.nonverbalMinutes, academicCount: r.academicCount, academicMinutes: r.academicMinutes }
    : NO_PATTERN;
}

/** The latest score in each part for one course (null where the person has not done that part yet). */
export async function getSectionScores(userId: string, course: string): Promise<Record<SectionId, number | null>> {
  const rows = await db
    .select({ section: attempt.section, percent: attempt.percent })
    .from(attempt)
    .where(and(eq(attempt.userId, userId), eq(attempt.militaryCourse, course), isNotNull(attempt.section)))
    .orderBy(desc(attempt.finishedAt))
    .limit(40);
  const out: Record<SectionId, number | null> = { verbal: null, nonverbal: null, academic: null };
  for (const r of rows) {
    const s = r.section as SectionId;
    if (s in out && out[s] === null) out[s] = Math.round(r.percent);
  }
  return out;
}
