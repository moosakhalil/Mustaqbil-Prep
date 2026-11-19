import type { Question } from "@/lib/question-types";
import { sanitizeAttempt, type Attempt } from "./attempt-logic";
import type { QuizQuestion } from "./build";

// What is saved in the account for an unfinished quiz: question ids, option order, answers, flags, times and position.
// The questions themselves come from the app's own question files, so a record is about 2 KB instead of about 20 KB.

export type ProgressQuestion = { id: string; course: string; o: number[] } | { full: QuizQuestion };

export type ProgressRecord = {
  id: string;
  planId: string;
  label: string;
  mode: "practice" | "exam";
  minutes: number;
  section?: string;
  militaryCourse?: string;
  mockId?: string;
  startedAt: number;
  enteredAt: number;
  elapsedMs: number;
  resumedAt: number | null;
  beatAt: number;
  index: number;
  answers: Attempt["answers"];
  flagged: string[];
  times: Record<string, number>;
  questions: ProgressQuestion[];
};

export function toRecord(a: Attempt): ProgressRecord {
  return {
    id: a.id, planId: a.planId, label: a.label, mode: a.mode, minutes: a.minutes,
    section: a.section, militaryCourse: a.militaryCourse, mockId: a.mockId,
    startedAt: a.startedAt, enteredAt: a.enteredAt, elapsedMs: a.elapsedMs, resumedAt: a.resumedAt, beatAt: a.beatAt,
    index: a.index, answers: a.answers, flagged: a.flagged, times: a.times,
    // a quiz made before option order was kept cannot be rebuilt from ids, so its questions are sent in full
    questions: a.questions.map((q): ProgressQuestion => (q.o ? { id: q.id, course: q.course, o: q.o } : { full: q })),
  };
}

/** One question rebuilt from the bank and the saved option order. Null when the bank no longer matches. */
export function rebuildQuestion(original: Question, course: string, order: readonly number[]): QuizQuestion | null {
  const n = original.o.length;
  if (order.length !== n || new Set(order).size !== n || order.some((i) => !Number.isInteger(i) || i < 0 || i >= n)) return null;
  return {
    id: original.id, course, unit: original.u, q: original.q, options: order.map((i) => original.o[i]),
    answer: order.indexOf(original.a), o: [...order], explanation: original.e,
    ...(original.img ? { img: original.img } : {}), ...(original.oimg ? { optionImages: original.oimg } : {}),
  };
}

/**
 * Turn a saved record back into a quiz. `lookup` returns a question file's questions (fetched once per course).
 * Null when the record is damaged or a question has since been removed from the bank.
 */
export async function fromRecord(raw: unknown, lookup: (course: string) => Promise<Question[]>): Promise<Attempt | null> {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<ProgressRecord>;
  if (!Array.isArray(r.questions) || r.questions.length === 0) return null;
  const questions: QuizQuestion[] = [];
  try {
    for (const item of r.questions) {
      if ("full" in item) {
        questions.push(item.full);
        continue;
      }
      const bank = await lookup(item.course);
      const original = bank.find((x) => x.id === item.id);
      const rebuilt = original ? rebuildQuestion(original, item.course, item.o) : null;
      if (!rebuilt) return null;
      questions.push(rebuilt);
    }
  } catch {
    return null; // a question file could not be loaded: try again later
  }
  const attempt = sanitizeAttempt({ ...r, questions, finishedAt: null });
  return attempt;
}
