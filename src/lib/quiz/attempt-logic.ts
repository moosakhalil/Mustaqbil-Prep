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
  /** When the current question was opened, or the clock last started or stopped. Doubles as "last activity" for the saved list. */
  enteredAt: number;
  finishedAt: number | null;
  /** Milliseconds the quiz screen was open before the current run. The exam clock counts only this time, so leaving pauses it. */
  elapsedMs: number;
  /** When the clock last started running; null while it is paused (the quiz screen is not open). */
  resumedAt: number | null;
  /** The last moment the quiz screen was known to be open. If the app is killed while running, the clock is settled to here. */
  beatAt: number;
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
    elapsedMs: 0, resumedAt: init.now, beatAt: init.now,
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
  const running = a.resumedAt !== null;
  return { ...a, times: running ? spend(a, now) : a.times, elapsedMs: activeMs(a, now), resumedAt: null, finishedAt: now };
}

/** Milliseconds the quiz screen has been open so far (paused time is not counted). */
export function activeMs(a: Attempt, now: number): number {
  return a.elapsedMs + (a.resumedAt !== null ? Math.max(0, now - a.resumedAt) : 0);
}

/** The quiz screen was left (leave button, phone locked, app switched or closed): stop the clock. */
export function pauseAttempt(a: Attempt, now: number): Attempt {
  if (isFinished(a) || a.resumedAt === null) return a;
  return { ...a, times: spend(a, now), elapsedMs: activeMs(a, now), resumedAt: null, enteredAt: now, beatAt: now };
}

/** The quiz screen is open again: start the clock from where it stopped. */
export function resumeAttempt(a: Attempt, now: number): Attempt {
  if (isFinished(a) || a.resumedAt !== null) return a;
  return { ...a, resumedAt: now, enteredAt: now, beatAt: now };
}

/** Note that the quiz screen is still open. Called every few seconds so a killed app loses almost no time. */
export function beatAttempt(a: Attempt, now: number): Attempt {
  if (isFinished(a) || a.resumedAt === null) return a;
  return { ...a, beatAt: Math.max(a.beatAt, now) };
}

/** Close a run that was never stopped (the app was killed): the clock counts only up to the last time the screen was known to be open. */
export function settleAttempt(a: Attempt): Attempt {
  if (isFinished(a) || a.resumedAt === null) return a;
  return { ...a, elapsedMs: a.elapsedMs + Math.max(0, a.beatAt - a.resumedAt), resumedAt: null };
}

/** Milliseconds left in an exam while the quiz screen is open. Infinity when untimed. */
export function remainingMs(a: Attempt, now: number): number {
  return a.minutes > 0 ? a.minutes * 60_000 - activeMs(a, now) : Infinity;
}

/** Milliseconds left as the clock stands at rest (paused, or settled to the last heartbeat). Used on Home, where nothing ticks. */
export function restingRemainingMs(a: Attempt): number {
  return a.minutes > 0 ? a.minutes * 60_000 - activeMs(settleAttempt(a), 0) : Infinity;
}

export type AttemptResult = {
  score: Score;
  durationSec: number;
  /** Average over the questions that were opened. */
  avgSeconds: number;
};

export function attemptResult(a: Attempt): AttemptResult {
  const score = scoreQuiz(a.questions, a.answers);
  const visited = Object.values(a.times).filter((t) => t > 0);
  const total = visited.reduce((s, t) => s + t, 0);
  return { score, durationSec: Math.max(0, Math.round(activeMs(a, a.finishedAt ?? a.enteredAt) / 1000)), avgSeconds: visited.length ? Math.round((total / visited.length) * 10) / 10 : 0 };
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
  const finishedAt = typeof r.finishedAt === "number" ? r.finishedAt : null;
  // a quiz saved before the pausing clock existed: count its time up to the last tap, and leave it paused
  const hasClock = typeof r.elapsedMs === "number" && Number.isFinite(r.elapsedMs) && r.elapsedMs >= 0;
  const elapsedMs = hasClock ? r.elapsedMs! : Math.max(0, (finishedAt ?? r.enteredAt) - r.startedAt);
  const resumedAt = finishedAt !== null ? null : hasClock && typeof r.resumedAt === "number" ? r.resumedAt : null;
  return {
    id: r.id, planId: r.planId, label: typeof r.label === "string" ? r.label : "Quiz", mode: r.mode,
    minutes: typeof r.minutes === "number" ? r.minutes : 0, section: typeof r.section === "string" ? r.section : undefined,
    militaryCourse: typeof r.militaryCourse === "string" ? r.militaryCourse : undefined, mockId: typeof r.mockId === "string" ? r.mockId : undefined,
    startedAt: r.startedAt, enteredAt: r.enteredAt, finishedAt, elapsedMs, resumedAt,
    beatAt: typeof r.beatAt === "number" ? r.beatAt : resumedAt ?? r.enteredAt,
    questions, answers: r.answers && typeof r.answers === "object" ? r.answers : {},
    flagged: Array.isArray(r.flagged) ? r.flagged.filter((x): x is string => typeof x === "string") : [],
    times: r.times && typeof r.times === "object" ? r.times : {},
    index: Number.isInteger(r.index) && r.index! >= 0 && r.index! < questions.length ? r.index! : 0,
  };
}
