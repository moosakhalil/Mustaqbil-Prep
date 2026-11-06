import type { QuizQuestion } from "./build";
import { shuffled, type Rng } from "./random";
import { scoreQuiz, type Answers, type Score } from "./score";
import type { Mode } from "./settings-logic";

/** One run through a quiz, from the first question to the result. Plain data, so it can be saved and sent to the server. */
export type Attempt = {
  id: string;
  /** The plan it was built from (or "retry-<id>"), so the quiz screen knows if a fresh quiz was asked for. */
  planId: string;
  label: string;
  mode: Mode;
  /** Exam time in minutes; 0 means untimed. */
  minutes: number;
  /** Military section ("verbal", "nonverbal", "academic") when this quiz is a military section. */
  section?: string;
  /** The military course (icto, lcc, navy-it, airforce-it) the section was practised for. */
  militaryCourse?: string;
  /** Set when the section belongs to a full mock test; the parts of one mock share it. */
  mockId?: string;
  startedAt: number;
  /** When the current question was opened (for time per question). */
  enteredAt: number;
  finishedAt: number | null;
  questions: QuizQuestion[];
  answers: Answers;
  flagged: string[];
  /** Seconds spent on each question. */
  times: Record<string, number>;
  index: number;
};

/** One long pause (phone locked, app in the background) must not count as time spent on a question. */
const MAX_SECONDS_PER_VISIT = 300;

export function createAttempt(init: {
  id: string; planId: string; label: string; mode: Mode; minutes: number; questions: QuizQuestion[]; now: number;
  section?: string; militaryCourse?: string; mockId?: string;
}): Attempt {
  return {
    id: init.id, planId: init.planId, label: init.label, mode: init.mode, minutes: init.mode === "exam" ? init.minutes : 0,
    section: init.section, militaryCourse: init.militaryCourse, mockId: init.mockId, startedAt: init.now, enteredAt: init.now, finishedAt: null,
    questions: init.questions, answers: {}, flagged: [], times: {}, index: 0,
  };
}

export const isFinished = (a: Attempt) => a.finishedAt !== null;
export const currentQuestion = (a: Attempt) => a.questions[a.index];
export const answeredCount = (a: Attempt) => a.questions.filter((q) => a.answers[q.id] != null).length;

/** Add the time since the current question was opened to that question. */
function spend(a: Attempt, now: number): Record<string, number> {
  const q = currentQuestion(a);
  if (!q) return a.times;
  const seconds = Math.min(Math.max(0, (now - a.enteredAt) / 1000), MAX_SECONDS_PER_VISIT);
  return { ...a.times, [q.id]: (a.times[q.id] ?? 0) + seconds };
}

/** Choose an option. In practice mode the first answer is final; in exam mode it can be changed until the end. */
export function answerQuestion(a: Attempt, qid: string, option: number, now: number): Attempt {
  if (isFinished(a)) return a;
  const q = a.questions.find((x) => x.id === qid);
  if (!q || option < 0 || option >= q.options.length) return a;
  if (a.mode === "practice" && a.answers[qid] != null) return a;
  return { ...a, answers: { ...a.answers, [qid]: option }, times: qid === currentQuestion(a)?.id ? spend(a, now) : a.times, enteredAt: qid === currentQuestion(a)?.id ? now : a.enteredAt };
}

/** Exam mode only: take an answer back. */
export function clearAnswer(a: Attempt, qid: string): Attempt {
  if (isFinished(a) || a.mode !== "exam" || a.answers[qid] == null) return a;
  const { [qid]: _removed, ...rest } = a.answers;
  void _removed;
  return { ...a, answers: rest };
}

export function toggleFlag(a: Attempt, qid: string): Attempt {
  if (isFinished(a)) return a;
  return { ...a, flagged: a.flagged.includes(qid) ? a.flagged.filter((x) => x !== qid) : [...a.flagged, qid] };
}

export function goTo(a: Attempt, index: number, now: number): Attempt {
  if (isFinished(a) || index < 0 || index >= a.questions.length || index === a.index) return a;
  return { ...a, times: spend(a, now), index, enteredAt: now };
}

export function finishAttempt(a: Attempt, now: number): Attempt {
  if (isFinished(a)) return a;
  return { ...a, times: spend(a, now), finishedAt: now };
}

/** Milliseconds left in an exam. Infinity when untimed. */
export function remainingMs(a: Attempt, now: number): number {
  return a.minutes > 0 ? a.startedAt + a.minutes * 60_000 - now : Infinity;
}

export type AttemptResult = {
  score: Score;
  durationSec: number;
  /** Average over the questions that were opened. */
  avgSeconds: number;
};

export function attemptResult(a: Attempt): AttemptResult {
  const score = scoreQuiz(a.questions, a.answers);
  const end = a.finishedAt ?? a.enteredAt;
  const visited = Object.values(a.times).filter((t) => t > 0);
  const total = visited.reduce((s, t) => s + t, 0);
  return { score, durationSec: Math.max(0, Math.round((end - a.startedAt) / 1000)), avgSeconds: visited.length ? Math.round((total / visited.length) * 10) / 10 : 0 };
}

/** A new practice attempt made of the questions answered wrongly (or skipped) in an earlier one, in a fresh random order. */
export function retryAttempt(prev: Attempt, ids: readonly string[], init: { id: string; now: number; mode?: Mode; rng?: Rng }): Attempt {
  const wanted = new Set(ids);
  const questions = shuffled(prev.questions.filter((q) => wanted.has(q.id)), init.rng);
  return createAttempt({
    id: init.id, planId: `retry-${init.id}`, label: `Retry: ${prev.label}`, mode: init.mode ?? "practice",
    minutes: init.mode === "exam" ? Math.max(questions.length, 1) : 0, questions, now: init.now,
    section: prev.section, militaryCourse: prev.militaryCourse,
  });
}

export function sanitizeAttempt(raw: unknown): Attempt | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<Attempt>;
  if (typeof r.id !== "string" || typeof r.planId !== "string" || !Array.isArray(r.questions) || r.questions.length === 0) return null;
  if (typeof r.startedAt !== "number" || typeof r.enteredAt !== "number" || (r.mode !== "practice" && r.mode !== "exam")) return null;
  const questions = r.questions.filter(
    (q): q is QuizQuestion => !!q && typeof q.id === "string" && Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(q.answer),
  );
  if (questions.length !== r.questions.length) return null;
  return {
    id: r.id, planId: r.planId, label: typeof r.label === "string" ? r.label : "Quiz", mode: r.mode,
    minutes: typeof r.minutes === "number" ? r.minutes : 0, section: typeof r.section === "string" ? r.section : undefined,
    militaryCourse: typeof r.militaryCourse === "string" ? r.militaryCourse : undefined, mockId: typeof r.mockId === "string" ? r.mockId : undefined,
    startedAt: r.startedAt, enteredAt: r.enteredAt, finishedAt: typeof r.finishedAt === "number" ? r.finishedAt : null,
    questions, answers: r.answers && typeof r.answers === "object" ? r.answers : {},
    flagged: Array.isArray(r.flagged) ? r.flagged.filter((x): x is string => typeof x === "string") : [],
    times: r.times && typeof r.times === "object" ? r.times : {},
    index: Number.isInteger(r.index) && r.index! >= 0 && r.index! < questions.length ? r.index! : 0,
  };
}
