import "server-only";
import { and, count, desc, eq, gte, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import { attempt, attemptUnit, profile, wrongQuestion } from "@/db/schema";
import { computeStreak, pkDay, weekStrip } from "@/lib/streak";

export type HistoryItem = {
  id: string; label: string; mode: string; section: string | null; percent: number; total: number; correct: number; finishedAt: string;
};

export type WeakTopic = { course: string; unit: number; total: number; correct: number; percent: number };

export type Progress = {
  quizzes: number;
  questionsAnswered: number;
  toRevise: number;
  streak: number;
  week: { day: string; done: boolean }[];
  /** Percent of the last quizzes, oldest first (for the trend line). */
  trend: number[];
  /** Change in average score, newer half against older half of the trend, in points. */
  change: number | null;
  weak: WeakTopic[];
  recent: HistoryItem[];
};

export async function getProgress(userId: string): Promise<Progress> {
  const today = pkDay(new Date());

  const [totals, revise, recentRows, dayRows, weakRows] = await Promise.all([
    db.select({ quizzes: count(), answered: sum(attempt.total) }).from(attempt).where(eq(attempt.userId, userId)),
    db.select({ n: count() }).from(wrongQuestion).where(eq(wrongQuestion.userId, userId)),
    db
      .select({
        id: attempt.id, label: attempt.label, mode: attempt.mode, section: attempt.section, percent: attempt.percent,
        total: attempt.total, correct: attempt.correct, finishedAt: attempt.finishedAt,
      })
      .from(attempt)
      .where(eq(attempt.userId, userId))
      .orderBy(desc(attempt.finishedAt))
      .limit(20),
    db
      .selectDistinct({ day: sql<string>`to_char(${attempt.finishedAt} at time zone 'UTC' at time zone 'Asia/Karachi', 'YYYY-MM-DD')` })
      .from(attempt)
      .where(and(eq(attempt.userId, userId), gte(attempt.finishedAt, new Date(Date.now() - 40 * 86_400_000)))),
    db
      .select({ course: attemptUnit.course, unit: attemptUnit.unit, total: sum(attemptUnit.total), correct: sum(attemptUnit.correct) })
      .from(attemptUnit)
      .where(eq(attemptUnit.userId, userId))
      .groupBy(attemptUnit.course, attemptUnit.unit)
      .having(sql`sum(${attemptUnit.total}) >= 5`)
      .orderBy(sql`sum(${attemptUnit.correct})::float / sum(${attemptUnit.total}) asc`)
      .limit(5),
  ]);

  const days = new Set(dayRows.map((r) => r.day));
  const trend = recentRows.slice(0, 10).map((r) => Math.round(r.percent)).reverse();
  let change: number | null = null;
  if (trend.length >= 4) {
    const half = Math.floor(trend.length / 2);
    const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
    change = Math.round(avg(trend.slice(trend.length - half)) - avg(trend.slice(0, half)));
  }

  return {
    quizzes: totals[0]?.quizzes ?? 0,
    questionsAnswered: Number(totals[0]?.answered ?? 0),
    toRevise: revise[0]?.n ?? 0,
    streak: computeStreak(days, today),
    week: weekStrip(days, today),
    trend,
    change,
    weak: weakRows.map((r) => {
      const total = Number(r.total);
      const correct = Number(r.correct);
      return { course: r.course, unit: r.unit, total, correct, percent: Math.round((correct / total) * 100) };
    }),
    recent: recentRows.map((r) => ({ ...r, finishedAt: r.finishedAt.toISOString() })),
  };
}

export async function getPreferredCourse(userId: string): Promise<string | null> {
  const rows = await db.select({ c: profile.preferredCourse }).from(profile).where(eq(profile.userId, userId)).limit(1);
  return rows[0]?.c ?? null;
}

/** The person's saved preferences: preferred military course and the day of their real test. */
export async function getProfileInfo(userId: string): Promise<{ preferredCourse: string | null; examDate: string | null; freshFirst: boolean }> {
  const rows = await db.select({ c: profile.preferredCourse, d: profile.examDate, f: profile.freshFirst }).from(profile).where(eq(profile.userId, userId)).limit(1);
  return { preferredCourse: rows[0]?.c ?? null, examDate: rows[0]?.d ?? null, freshFirst: rows[0]?.f ?? true };
}
