import { describe, expect, it } from "vitest";
import type { QuizQuestion } from "./build";
import { answerQuestion, attemptResult, clearAnswer, createAttempt, finishAttempt, goTo, remainingMs, retryAttempt, sanitizeAttempt, toggleFlag } from "./attempt-logic";
import { seededRng } from "./random";

const qs: QuizQuestion[] = ["a", "b", "c", "d"].map((id, i) => ({
  id, course: "os", unit: 1, q: `Q ${id}`, options: ["w", "x", "y", "z"], answer: i % 4, explanation: "e",
}));
const start = (mode: "practice" | "exam" = "practice", minutes = 0) =>
  createAttempt({ id: "t1", planId: "p1", label: "OS", mode, minutes, questions: qs, now: 1_000_000 });

describe("attempt", () => {
  it("practice: the first answer is final", () => {
    let a = start();
    a = answerQuestion(a, "a", 2, 1_001_000);
    a = answerQuestion(a, "a", 0, 1_002_000);
    expect(a.answers.a).toBe(2);
  });

  it("exam: an answer can be changed or taken back", () => {
    let a = start("exam", 10);
    a = answerQuestion(a, "a", 2, 1_001_000);
    a = answerQuestion(a, "a", 1, 1_002_000);
    expect(a.answers.a).toBe(1);
    expect(clearAnswer(a, "a").answers.a).toBeUndefined();
  });

  it("counts the time on each question and caps one long pause", () => {
    let a = start();
    a = goTo(a, 1, 1_000_000 + 12_000);
    a = goTo(a, 2, 1_000_000 + 12_000 + 3_600_000); // an hour on question b is capped
    a = finishAttempt(a, 1_000_000 + 12_000 + 3_600_000 + 5_000);
    expect(a.times).toEqual({ a: 12, b: 300, c: 5 });
    expect(attemptResult(a).avgSeconds).toBeCloseTo(105.7, 1);
  });

  it("scores, and skipped questions count as not correct", () => {
    let a = start();
    a = answerQuestion(a, "a", 0, 1_001_000); // right
    a = answerQuestion(a, "b", 0, 1_002_000); // wrong (answer is 1)
    a = finishAttempt(a, 1_010_000);
    const { score, durationSec } = attemptResult(a);
    expect(score).toMatchObject({ total: 4, correct: 1, wrong: 1, skipped: 2, percent: 25 });
    expect(durationSec).toBe(10);
  });

  it("exam time runs out", () => {
    const a = start("exam", 2);
    expect(remainingMs(a, 1_000_000 + 60_000)).toBe(60_000);
    expect(remainingMs(a, 1_000_000 + 130_000)).toBeLessThan(0);
    expect(remainingMs(start(), 5)).toBe(Infinity);
  });

  it("flags a question and ignores changes after finishing", () => {
    let a = toggleFlag(start("exam", 5), "c");
    expect(a.flagged).toEqual(["c"]);
    a = finishAttempt(a, 1_005_000);
    expect(answerQuestion(a, "a", 1, 1_006_000)).toBe(a);
    expect(toggleFlag(a, "c")).toBe(a);
  });

  it("retry keeps only the chosen questions, in a new attempt", () => {
    const r = retryAttempt(start(), ["b", "d"], { id: "t2", now: 2_000_000, rng: seededRng(3) });
    expect(r.questions.map((q) => q.id).sort()).toEqual(["b", "d"]);
    expect(r).toMatchObject({ id: "t2", planId: "retry-t2", mode: "practice", finishedAt: null, index: 0 });
  });

  it("repairs or rejects damaged saved attempts", () => {
    expect(sanitizeAttempt(JSON.parse(JSON.stringify(start())))).toMatchObject({ id: "t1", index: 0 });
    expect(sanitizeAttempt({ id: "x" })).toBeNull();
    expect(sanitizeAttempt(null)).toBeNull();
  });
});
