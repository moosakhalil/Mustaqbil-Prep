import type { QuizQuestion } from "./build";

/** Question id -> index of the option chosen (in the shuffled options). Missing or null means skipped. */
export type Answers = Record<string, number | null | undefined>;

export type Tally = { total: number; correct: number; wrong: number; skipped: number };

export type Score = Tally & {
  /** Whole-number percentage, rounded to one decimal place (correct out of total, skipped count as not correct). */
  percent: number;
  byCourse: Record<string, Tally>;
  /** Key is `${course}:${unit}`. */
  byUnit: Record<string, Tally>;
  wrongIds: string[];
  skippedIds: string[];
};

const empty = (): Tally => ({ total: 0, correct: 0, wrong: 0, skipped: 0 });

export function scoreQuiz(questions: readonly QuizQuestion[], answers: Answers): Score {
  const score: Score = { ...empty(), percent: 0, byCourse: {}, byUnit: {}, wrongIds: [], skippedIds: [] };

  for (const q of questions) {
    const picked = answers[q.id];
    const kind: keyof Omit<Tally, "total"> = picked == null ? "skipped" : picked === q.answer ? "correct" : "wrong";
    const unitKey = `${q.course}:${q.unit}`;
    for (const t of [score, (score.byCourse[q.course] ??= empty()), (score.byUnit[unitKey] ??= empty())]) {
      t.total++;
      t[kind]++;
    }
    if (kind === "wrong") score.wrongIds.push(q.id);
    if (kind === "skipped") score.skippedIds.push(q.id);
  }

  score.percent = score.total === 0 ? 0 : Math.round((score.correct / score.total) * 1000) / 10;
  return score;
}
