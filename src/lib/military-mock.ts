import { newId } from "./id";
import { createBrowserStore } from "./session-store";
import { SECTIONS } from "./military";
import type { SubjectRow } from "./military-data";
import { EXAMPLE_COUNTS, type Pattern } from "./military-pattern";
import { setAttempt } from "./quiz/attempt";
import { isFinished, type Attempt } from "./quiz/attempt-logic";
import { beginAttempt, deleteMockParts } from "./quiz/library";
import { buildSectionAttempt, sectionAvailable } from "./quiz/military-quiz";
import { EXPIRE_MS } from "./quiz/library-logic";
import { markGone } from "./progress-queue";
import { scoreQuiz } from "./quiz/score";
import { setPlan } from "./quiz/settings";

export type MockPart = {
  section: (typeof SECTIONS)[number]["id"];
  count: number;
  minutes: number;
  attemptId: string | null;
  percent: number | null;
  correct: number | null;
  total: number | null;
};

/** A full mock test in progress: the three parts one after another, each timed. Kept on the phone. */
export type Mock = { id: string; course: string; subjects: SubjectRow[]; parts: MockPart[]; current: number; done: boolean; touchedAt: number };

export function sanitizeMock(raw: unknown): Mock | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<Mock>;
  if (typeof r.id !== "string" || typeof r.course !== "string" || !Array.isArray(r.parts) || r.parts.length !== 3 || !Array.isArray(r.subjects)) return null;
  const ok = r.parts.every((p) => p && SECTIONS.some((s) => s.id === p.section) && typeof p.count === "number" && typeof p.minutes === "number");
  if (!ok) return null;
  return {
    id: r.id, course: r.course, subjects: r.subjects, parts: r.parts, current: Number.isInteger(r.current) ? r.current! : 0, done: !!r.done,
    touchedAt: typeof r.touchedAt === "number" ? r.touchedAt : Date.now(),
  };
}

const store = createBrowserStore<Mock | null>("mp.mock.v1", null, sanitizeMock, "local");
export const useMock = store.useStore;
export const getMock = store.get;
export const setMock = store.set;

/** True while a mock test is in progress (not finished). Only one can be kept at a time. */
export const mockInProgress = (m: Mock | null): m is Mock => !!m && !m.done;

/** Remove a mock test that nobody touched for 14 days. Call when the app opens. */
export function expireMock(now = Date.now()) {
  const mock = store.get();
  if (!mockInProgress(mock) || now - mock.touchedAt < EXPIRE_MS) return;
  deleteMockParts(mock.id);
  store.set(null);
}

/** Throw away the mock test in progress and its saved part (the account's copy goes too). */
export function discardMock() {
  const mock = store.get();
  if (!mock) return;
  deleteMockParts(mock.id);
  markGone(`mock:${mock.id}`);
  store.set(null);
}

/** Counts and minutes of each part: the owner's pattern where set, otherwise the example numbers, never more than the questions available. */
export function planParts(pattern: Pattern, subjects: readonly SubjectRow[], course?: string): MockPart[] {
  return SECTIONS.map(({ id }) => {
    const avail = sectionAvailable(id, subjects, course);
    const set = pattern[`${id}Count` as keyof Pattern] as number;
    const count = Math.min(set > 0 ? set : EXAMPLE_COUNTS[id], avail);
    const minutes = (pattern[`${id}Minutes` as keyof Pattern] as number) || count;
    return { section: id, count, minutes, attemptId: null, percent: null, correct: null, total: null };
  });
}

/**
 * Start the first part of a mock test. "failed" when a part has no questions (a full mock needs all three).
 * "blocked" when another mock test is still in progress: a window asks whether to delete it first.
 */
export async function startMock(course: string, subjects: SubjectRow[], pattern: Pattern): Promise<"started" | "blocked" | "failed"> {
  const parts = planParts(pattern, subjects, course);
  if (parts.some((p) => p.count < 1)) return "failed";
  const mock: Mock = { id: newId(), course, subjects, parts, current: 0, done: false, touchedAt: Date.now() };
  const first = await buildSectionAttempt({ course, section: parts[0].section, subjects, count: parts[0].count, mode: "exam", minutes: parts[0].minutes, mockId: mock.id });
  if (!first) return "failed";
  const install = () => {
    setMock(mock);
    setPlan(null);
  };
  const old = store.get();
  const result = beginAttempt(first, { mockSlotFull: mockInProgress(old), dropMock: () => { discardMock(); install(); } });
  if (result === "started") install();
  return result;
}

/** Which part comes next: the one after the part just finished, or the same part again when its attempt was lost. */
const nextIndex = (mock: Mock) => (mock.parts[mock.current].attemptId !== null ? mock.current + 1 : mock.current);

/** Go on to the next part (its clock starts now). "result" when all three are done. */
export async function continueMock(): Promise<"quiz" | "result" | "error"> {
  const mock = store.get();
  if (!mock) return "error";
  const next = nextIndex(mock);
  if (next >= mock.parts.length) {
    store.set({ ...mock, done: true, touchedAt: Date.now() });
    markGone(`mock:${mock.id}`);
    return "result";
  }
  const part = mock.parts[next];
  const attempt = await buildSectionAttempt({ course: mock.course, section: part.section, subjects: mock.subjects, count: part.count, mode: "exam", minutes: part.minutes, mockId: mock.id });
  if (!attempt) return "error";
  store.set({ ...mock, current: next, touchedAt: Date.now() });
  setPlan(null);
  setAttempt(attempt);
  return "quiz";
}

/**
 * A mock part just finished: remember its score. After the first two parts the student sees the Congratulations screen ("next");
 * after the last part the mock is complete and its summary opens ("result").
 */
export function completeMockPart(attempt: Attempt): "next" | "result" | null {
  recordMockPart(attempt);
  const mock = store.get();
  if (!mock || attempt.mockId !== mock.id) return null;
  if (mock.parts.every((p) => p.attemptId !== null)) {
    store.set({ ...mock, done: true, touchedAt: Date.now() });
    markGone(`mock:${mock.id}`); // a finished mock no longer needs saving in the account
    return "result";
  }
  return "next";
}

/** Remember the score of a finished part. Safe to call again for the same attempt. */
export function recordMockPart(attempt: Attempt) {
  const mock = store.get();
  if (!mock || attempt.mockId !== mock.id || !isFinished(attempt)) return;
  const i = mock.parts.findIndex((p) => p.section === attempt.section);
  if (i < 0 || mock.parts[i].attemptId === attempt.id) return;
  const s = scoreQuiz(attempt.questions, attempt.answers);
  const parts = mock.parts.map((p, j) => (j === i ? { ...p, attemptId: attempt.id, percent: s.percent, correct: s.correct, total: s.total } : p));
  store.set({ ...mock, parts, touchedAt: Date.now() });
}
