import "server-only";
import { and, eq, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { savedMock, savedQuiz } from "@/db/schema";
import { MILITARY_COURSES } from "@/lib/military";
import { quizQuestionSchema } from "./attempts";

// Unfinished quizzes kept in the account. A record is the small saved form (see lib/quiz/progress-record.ts).

const EXPIRE_MS = 14 * 24 * 60 * 60 * 1000;
/** Three quizzes and one mock part is the normal most; the rest is room for a copy from another phone that has not synced yet. */
const MAX_ROWS = 8;

const recordSchema = z.object({
  id: z.string().min(8).max(80),
  planId: z.string().max(120),
  label: z.string().max(200),
  mode: z.enum(["practice", "exam"]),
  minutes: z.number().min(0).max(600),
  section: z.enum(["verbal", "nonverbal", "academic"]).optional(),
  militaryCourse: z.enum(MILITARY_COURSES.map((c) => c.id) as [string, ...string[]]).optional(),
  mockId: z.string().max(80).optional(),
  startedAt: z.number(),
  enteredAt: z.number(),
  elapsedMs: z.number().min(0).max(1_000_000_000),
  resumedAt: z.number().nullable(),
  beatAt: z.number(),
  index: z.number().int().min(0).max(499),
  answers: z.record(z.string(), z.number().int().min(0).max(5).nullable().optional()),
  flagged: z.array(z.string().max(60)).max(500),
  times: z.record(z.string(), z.number().min(0).max(100_000)),
  questions: z
    .array(z.union([z.object({ id: z.string().min(1).max(60), course: z.string().min(1).max(60), o: z.array(z.number().int().min(0).max(5)).min(2).max(6) }), z.object({ full: quizQuestionSchema })]))
    .min(1)
    .max(500),
});

const mockSchema = z.object({
  id: z.string().min(8).max(80),
  course: z.string().max(60),
  subjects: z.array(z.record(z.string(), z.unknown())).max(60),
  parts: z
    .array(
      z.object({
        section: z.enum(["verbal", "nonverbal", "academic"]),
        count: z.number().min(0).max(1000),
        minutes: z.number().min(0).max(600),
        attemptId: z.string().max(80).nullable(),
        percent: z.number().min(0).max(100).nullable(),
        correct: z.number().nullable(),
        total: z.number().nullable(),
      }),
    )
    .length(3),
  current: z.number().int().min(0).max(2),
  done: z.boolean(),
  touchedAt: z.number(),
});

export type ProgressSnapshot = {
  quizzes: { record: unknown; activityAt: number }[];
  mock: { state: unknown; touchedAt: number } | null;
};

/** Everything saved for this person. Anything untouched for 14 days is removed first. */
export async function listProgress(userId: string): Promise<ProgressSnapshot> {
  const cutoff = new Date(Date.now() - EXPIRE_MS);
  await db.delete(savedQuiz).where(and(eq(savedQuiz.userId, userId), lt(savedQuiz.activityAt, cutoff)));
  await db.delete(savedMock).where(and(eq(savedMock.userId, userId), lt(savedMock.touchedAt, cutoff)));
  const [quizzes, mocks] = await Promise.all([
    db.select().from(savedQuiz).where(eq(savedQuiz.userId, userId)),
    db.select().from(savedMock).where(eq(savedMock.userId, userId)).limit(1),
  ]);
  return {
    quizzes: quizzes.map((r) => ({ record: r.record, activityAt: r.activityAt.getTime() })),
    mock: mocks[0] ? { state: mocks[0].state, touchedAt: mocks[0].touchedAt.getTime() } : null,
  };
}

export type SaveProgress = "saved" | "invalid" | "full";

/** Save (or update) one unfinished quiz. An older copy never overwrites a newer one. */
export async function saveQuizProgress(userId: string, raw: unknown): Promise<SaveProgress> {
  const parsed = recordSchema.safeParse(raw);
  if (!parsed.success) return "invalid";
  const r = parsed.data;
  const ids = new Set(r.questions.map((q) => ("full" in q ? q.full.id : q.id)));
  if (ids.size !== r.questions.length || Object.keys(r.answers).some((id) => !ids.has(id))) return "invalid";

  const rows = await db.select({ id: savedQuiz.id }).from(savedQuiz).where(eq(savedQuiz.userId, userId));
  if (rows.length >= MAX_ROWS && !rows.some((x) => x.id === r.id)) return "full";

  const activityAt = new Date(r.enteredAt);
  await db
    .insert(savedQuiz)
    .values({ id: r.id, userId, mockId: r.mockId ?? null, record: r, activityAt })
    .onConflictDoUpdate({
      target: savedQuiz.id,
      set: { record: r, mockId: r.mockId ?? null, activityAt, updatedAt: new Date() },
      setWhere: and(eq(savedQuiz.userId, userId), sql`${savedQuiz.activityAt} <= ${activityAt}`),
    });
  return "saved";
}

/** Save the mock test in progress (the one slot is replaced). */
export async function saveMockProgress(userId: string, raw: unknown): Promise<"saved" | "invalid"> {
  const parsed = mockSchema.safeParse(raw);
  if (!parsed.success) return "invalid";
  const m = parsed.data;
  const touchedAt = new Date(m.touchedAt);
  await db
    .insert(savedMock)
    .values({ userId, mockId: m.id, state: m, touchedAt })
    .onConflictDoUpdate({
      target: savedMock.userId,
      set: { mockId: m.id, state: m, touchedAt, updatedAt: new Date() },
      setWhere: sql`${savedMock.touchedAt} <= ${touchedAt}`,
    });
  return "saved";
}

/** Remove a saved quiz, or the mock when the id looks like "mock:<id>". */
export async function deleteProgress(userId: string, id: string): Promise<void> {
  if (id.startsWith("mock:")) {
    await db.delete(savedMock).where(and(eq(savedMock.userId, userId), eq(savedMock.mockId, id.slice(5))));
    return;
  }
  await db.delete(savedQuiz).where(and(eq(savedQuiz.userId, userId), eq(savedQuiz.id, id)));
}
