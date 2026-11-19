import { describe, expect, it } from "vitest";
import {
  answerQuestion, attemptResult, createAttempt, finishAttempt, pauseAttempt, remainingMs, restingRemainingMs, resumeAttempt, sanitizeAttempt, settleAttempt,
  type Attempt,
} from "./attempt-logic";
import type { QuizQuestion } from "./build";
import { EXPIRE_MS, SAVED_LIMIT, begin, hasRoom, park, purgeExpired, quizzesOf, removeOf, resumeOf, type Library } from "./library-logic";
import { fromRecord, rebuildQuestion, toRecord } from "./progress-record";
import type { Question } from "@/lib/question-types";

const T0 = 1_000_000;
const MIN = 60_000;
const qs: QuizQuestion[] = ["a", "b", "c"].map((id) => ({ id, course: "os", unit: 1, q: `Q ${id}`, options: ["w", "x", "y", "z"], answer: 0, explanation: "e" }));
const make = (id: string, over: Partial<Attempt> = {}): Attempt => ({
  ...createAttempt({ id, planId: `p-${id}`, label: id, mode: "practice", minutes: 0, questions: qs, now: T0 }),
  ...over,
});
const exam = (minutes: number) => createAttempt({ id: "e1", planId: "p", label: "Verbal", mode: "exam", minutes, questions: qs, now: T0 });

describe("pausing clock", () => {
  it("leaving pauses it, and six hours away costs nothing", () => {
    let a = exam(20);
    a = pauseAttempt(a, T0 + 15 * MIN); // 15 minutes used, 5 left
    expect(remainingMs(a, T0 + 15 * MIN + 6 * 3_600_000)).toBe(5 * MIN);
    a = resumeAttempt(a, T0 + 15 * MIN + 6 * 3_600_000);
    expect(remainingMs(a, T0 + 15 * MIN + 6 * 3_600_000 + 2 * MIN)).toBe(3 * MIN);
  });

  it("a killed app only counts time up to the last heartbeat", () => {
    let a = exam(20);
    a = { ...a, beatAt: T0 + 10 * MIN }; // last known open at 10 minutes, then the app was killed (never paused)
    expect(restingRemainingMs(a)).toBe(10 * MIN);
    const settled = settleAttempt(a);
    expect(settled.resumedAt).toBeNull();
    expect(remainingMs(settled, T0 + 5 * 3_600_000)).toBe(10 * MIN);
  });

  it("the saved duration is the time the screen was open, not the time between start and finish", () => {
    let a = make("p1");
    a = answerQuestion(a, "a", 0, T0 + 1000);
    a = pauseAttempt(a, T0 + 60_000);
    a = resumeAttempt(a, T0 + 3_600_000);
    a = finishAttempt(a, T0 + 3_600_000 + 30_000);
    expect(attemptResult(a).durationSec).toBe(90);
  });

  it("finishing while paused still ends cleanly", () => {
    const a = finishAttempt(pauseAttempt(exam(20), T0 + 5 * MIN), T0 + 99 * MIN);
    expect(a.resumedAt).toBeNull();
    expect(a.elapsedMs).toBe(5 * MIN);
  });

  it("a quiz saved before the clock could pause is kept paused, counted up to its last tap", () => {
    const old = { id: "o", planId: "p", mode: "exam", minutes: 20, startedAt: T0, enteredAt: T0 + 4 * MIN, finishedAt: null, questions: qs, answers: {}, flagged: [], times: {}, index: 0 };
    const a = sanitizeAttempt(old)!;
    expect(a.resumedAt).toBeNull();
    expect(remainingMs(a, T0 + 100 * MIN)).toBe(16 * MIN);
  });
});

describe("saved quizzes", () => {
  const lib = (active: Attempt | null, ...shelf: Attempt[]): Library => ({ active, shelf });

  it("starting a new quiz keeps the one that was on screen", () => {
    const next = begin(lib(make("a")), make("b"));
    expect(next.active?.id).toBe("b");
    expect(next.shelf.map((x) => x.id)).toEqual(["a"]);
  });

  it("a finished quiz on screen is not kept", () => {
    const done = finishAttempt(make("a"), T0 + 1000);
    expect(begin(lib(done), make("b")).shelf).toEqual([]);
  });

  it("allows three quizzes and then no room; a mock part does not use a place", () => {
    const three = lib(make("c"), make("a"), make("b"));
    expect(quizzesOf(three)).toHaveLength(SAVED_LIMIT);
    expect(hasRoom(three)).toBe(false);
    const withMock = lib(make("c"), make("a"), make("m", { mockId: "mock1" }));
    expect(hasRoom(withMock)).toBe(true);
    expect(removeOf(three, "a").shelf.map((x) => x.id)).toEqual(["b"]);
  });

  it("resuming a shelved quiz sets the screen's quiz aside, with its clock stopped", () => {
    const running = exam(20);
    const next = resumeOf(lib(running, make("a")), "a");
    expect(next.active?.id).toBe("a");
    expect(next.shelf[0].id).toBe("e1");
    expect(next.shelf[0].resumedAt).toBeNull();
    expect(park(lib(null))).toEqual(lib(null));
  });

  it("removes progress after 14 days without activity", () => {
    const old = make("old", { enteredAt: T0 });
    const fresh = make("new", { enteredAt: T0 + EXPIRE_MS });
    const next = purgeExpired(lib(fresh, old), T0 + EXPIRE_MS + 1000);
    expect(next.shelf).toEqual([]);
    expect(next.active?.id).toBe("new");
  });
});

describe("account record", () => {
  const bank: Question[] = [{ id: "os-1", u: 2, q: "Which?", o: ["A", "B", "C", "None of these"], a: 1, e: "because", p: [3] }];
  const quiz: QuizQuestion = { id: "os-1", course: "os", unit: 2, q: "Which?", options: ["C", "B", "A", "None of these"], answer: 1, o: [2, 1, 0, 3], explanation: "because" };

  it("rebuilds a question from its id and option order", () => {
    expect(rebuildQuestion(bank[0], "os", [2, 1, 0, 3])).toEqual(quiz);
    expect(rebuildQuestion(bank[0], "os", [0, 0, 1, 2])).toBeNull(); // not a real order
  });

  it("is small, and a saved quiz comes back with its answers, flags and clock", async () => {
    const a = pauseAttempt(answerQuestion(createAttempt({ id: "r1", planId: "p", label: "OS", mode: "exam", minutes: 10, questions: [quiz], now: T0 }), "os-1", 1, T0 + 5000), T0 + 9000);
    const record = toRecord({ ...a, flagged: ["os-1"] });
    expect(JSON.stringify(record).length).toBeLessThan(900);
    const back = await fromRecord(JSON.parse(JSON.stringify(record)), async () => bank);
    expect(back).not.toBeNull();
    expect(back!.questions).toEqual([quiz]);
    expect(back!.answers).toEqual({ "os-1": 1 });
    expect(back!.flagged).toEqual(["os-1"]);
    expect(back!.elapsedMs).toBe(9000);
    expect(back!.resumedAt).toBeNull();
  });

  it("gives up cleanly when a question was removed from the bank", async () => {
    const record = toRecord(createAttempt({ id: "r2", planId: "p", label: "OS", mode: "practice", minutes: 0, questions: [quiz], now: T0 }));
    expect(await fromRecord(record, async () => [])).toBeNull();
  });

  it("sends a quiz made before option order was kept in full", () => {
    const { o, ...plain } = quiz;
    void o;
    const record = toRecord(createAttempt({ id: "r3", planId: "p", label: "OS", mode: "practice", minutes: 0, questions: [plain], now: T0 }));
    expect("full" in record.questions[0]).toBe(true);
  });
});
