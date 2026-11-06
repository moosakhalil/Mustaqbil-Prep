import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { attempt, attemptUnit, seenQuestion, wrongQuestion } from "@/db/schema";
import { seenKey } from "@/lib/fresh-logic";
import { attemptResult, type Attempt } from "@/lib/quiz/attempt-logic";

const question = z.object({
  id: z.string().min(1).max(60),
  course: z.string().min(1).max(60),
  unit: z.number().int().min(0).max(10_000),
  q: z.string().max(5_000),
  options: z.array(z.string().max(2_000)).min(2).max(6),
  answer: z.number().int().min(0).max(5),
  explanation: z.string().max(8_000),
  img: z.string().max(300).startsWith("/data/").optional(),
  optionImages: z.array(z.string().max(300).startsWith("/data/")).max(6).optional(),
});

export const attemptSchema = z.object({
  id: z.string().min(8).max(80),
  planId: z.string().max(120),
  label: z.string().max(200),
  mode: z.enum(["practice", "exam"]),
  minutes: z.number().min(0).max(600),
  section: z.enum(["verbal", "nonverbal", "academic"]).optional(),
  militaryCourse: z.enum(["icto", "lcc", "navy-it", "airforce-it"]).optional(),
  mockId: z.string().max(80).optional(),
  startedAt: z.number(),
  enteredAt: z.number(),
  finishedAt: z.number(),
  questions: z.array(question).min(1).max(500),
  answers: z.record(z.string(), z.number().int().min(0).max(5).nullable().optional()),
  flagged: z.array(z.string()).max(500),
  times: z.record(z.string(), z.number().min(0).max(100_000)),
  index: z.number().int().min(0),
});

export type SaveResult = "saved" | "exists" | "invalid";

/**
 * Save a finished quiz for one person. The score is worked out again here from the answers, never taken from the client.
 * Also updates the wrong-answer notebook (wrong adds a question, a later correct answer removes it).
 */
export async function saveAttempt(userId: string, raw: unknown): Promise<SaveResult> {
  const parsed = attemptSchema.safeParse(raw);
  if (!parsed.success) return "invalid";
  const a = parsed.data as Attempt;

  const ids = new Set(a.questions.map((q) => q.id));
  if (ids.size !== a.questions.length) return "invalid";
  if (Object.keys(a.answers).some((id) => !ids.has(id))) return "invalid";
  for (const q of a.questions) {
    const given = a.answers[q.id];
    if (q.answer >= q.options.length || (given != null && given >= q.options.length)) return "invalid";
  }

  const { score, durationSec } = attemptResult(a);
  const finishedMs = parsed.data.finishedAt;
  const finishedAt = new Date(finishedMs);

  return db.transaction(async (tx) => {
    const found = await tx.select({ userId: attempt.userId }).from(attempt).where(eq(attempt.id, a.id)).limit(1);
    if (found.length > 0) return "exists";

    await tx.insert(attempt).values({
      id: a.id, userId, label: a.label, mode: a.mode, section: a.section ?? null, militaryCourse: a.militaryCourse ?? null, mockId: a.mockId ?? null,
      startedAt: new Date(a.startedAt), finishedAt, durationSec,
      total: score.total, correct: score.correct, wrong: score.wrong, skipped: score.skipped, percent: score.percent,
      payload: { questions: a.questions, answers: a.answers, flagged: a.flagged, times: a.times, minutes: a.minutes, startedAt: a.startedAt, finishedAt: finishedMs },
    });

    const units = Object.entries(score.byUnit).map(([key, t]) => {
      const cut = key.lastIndexOf(":");
      return { attemptId: a.id, userId, course: key.slice(0, cut), unit: Number(key.slice(cut + 1)), total: t.total, correct: t.correct };
    });
    if (units.length) await tx.insert(attemptUnit).values(units);

    // wrong-answer notebook
    const rightIds = a.questions.filter((q) => a.answers[q.id] === q.answer).map((q) => q.id);
    if (rightIds.length) await tx.delete(wrongQuestion).where(and(eq(wrongQuestion.userId, userId), inArray(wrongQuestion.questionId, rightIds)));
    for (const id of score.wrongIds) {
      await tx
        .insert(wrongQuestion)
        .values({ userId, questionId: id })
        .onConflictDoUpdate({ target: [wrongQuestion.userId, wrongQuestion.questionId], set: { times: sql`${wrongQuestion.times} + 1`, updatedAt: new Date() } });
    }
    // remember every question shown, for "fresh questions first"
    const now = new Date();
    const keys = [...new Set(a.questions.map((q) => seenKey(q.id)))];
    if (keys.length) {
      await tx
        .insert(seenQuestion)
        .values(keys.map((questionId) => ({ userId, questionId, lastSeen: now })))
        .onConflictDoUpdate({ target: [seenQuestion.userId, seenQuestion.questionId], set: { times: sql`${seenQuestion.times} + 1`, lastSeen: now } });
    }
    return "saved";
  });
}

/** A saved quiz of this person, rebuilt as an Attempt so the result, review and PDF screens can show it. Null if it is not theirs. */
export async function getSavedAttempt(userId: string, id: string): Promise<Attempt | null> {
  const rows = await db.select().from(attempt).where(and(eq(attempt.id, id), eq(attempt.userId, userId))).limit(1);
  const row = rows[0];
  if (!row) return null;
  const p = row.payload as {
    questions: Attempt["questions"]; answers: Attempt["answers"]; flagged: string[]; times: Record<string, number>; minutes: number; startedAt: number; finishedAt: number;
  };
  return {
    id: row.id, planId: "saved", label: row.label, mode: row.mode === "exam" ? "exam" : "practice", minutes: p.minutes, section: row.section ?? undefined, militaryCourse: row.militaryCourse ?? undefined, mockId: row.mockId ?? undefined,
    startedAt: p.startedAt, enteredAt: p.finishedAt, finishedAt: p.finishedAt, questions: p.questions, answers: p.answers, flagged: p.flagged, times: p.times, index: 0,
  };
}
