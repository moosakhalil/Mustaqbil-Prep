import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { CourseData, Manifest, Question } from "../question-types";
import { buildQuiz, shuffleOptions } from "./build";
import { allocate } from "./mix";
import { seededRng } from "./random";
import { scoreQuiz } from "./score";

const q = (id: string, u = 1, extra: Partial<Question> = {}): Question => ({
  id, u, q: `Question ${id}`, o: [`${id}-A`, `${id}-B`, `${id}-C`, `${id}-D`], a: 2, e: "because", ...extra,
});
const many = (code: string, n: number) => Array.from({ length: n }, (_, i) => q(`${code}-${i + 1}`));
const sum = (r: Record<string, number>) => Object.values(r).reduce((s, n) => s + n, 0);

describe("allocate (percentage mix)", () => {
  it("splits evenly and keeps the total exact", () => {
    const r = allocate(100, ["a", "b", "c"].map((id) => ({ id, capacity: 500, weight: 1 })));
    expect(r).toEqual({ a: 34, b: 33, c: 33 });
  });

  it("follows the percentages (35 / 16 / 49 of 100)", () => {
    const r = allocate(100, [
      { id: "a", capacity: 500, weight: 35 }, { id: "b", capacity: 500, weight: 16 }, { id: "c", capacity: 500, weight: 49 },
    ]);
    expect(r).toEqual({ a: 35, b: 16, c: 49 });
  });

  it("uses the largest remainder when shares are not whole (30 questions)", () => {
    const r = allocate(30, [
      { id: "a", capacity: 500, weight: 35 }, { id: "b", capacity: 500, weight: 16 }, { id: "c", capacity: 500, weight: 49 },
    ]);
    expect(r).toEqual({ a: 10, b: 5, c: 15 });
    expect(sum(r)).toBe(30);
  });

  it("gives a short course everything it has and shares the shortfall among the others", () => {
    const r = allocate(50, [{ id: "a", capacity: 5, weight: 50 }, { id: "b", capacity: 100, weight: 50 }]);
    expect(r).toEqual({ a: 5, b: 45 });
  });

  it("returns fewer questions when everything is used up", () => {
    const r = allocate(100, [{ id: "a", capacity: 10, weight: 1 }, { id: "b", capacity: 20, weight: 1 }]);
    expect(r).toEqual({ a: 10, b: 20 });
  });
});

describe("shuffleOptions", () => {
  it("always follows the correct option and keeps pinned options last", () => {
    const question = q("x", 1, { o: ["red", "green", "none of these", "blue"], a: 3, p: [2] });
    for (let seed = 1; seed <= 200; seed++) {
      const { options, answer } = shuffleOptions(question, seededRng(seed));
      expect(options[answer]).toBe("blue");
      expect(options[3]).toBe("none of these");
      expect([...options].sort()).toEqual([...question.o].sort());
    }
  });

  it("really changes the order between attempts", () => {
    const question = q("y");
    const orders = new Set(Array.from({ length: 50 }, (_, s) => shuffleOptions(question, seededRng(s + 1)).options.join("|")));
    expect(orders.size).toBeGreaterThan(5);
  });
});

describe("buildQuiz", () => {
  const courses = [
    { id: "a", weight: 1, questions: many("a", 40) },
    { id: "b", weight: 1, questions: many("b", 40) },
  ];

  it("picks the right count per course with no repeats", () => {
    const quiz = buildQuiz({ total: 21, courses, rng: seededRng(7) });
    expect(quiz).toHaveLength(21);
    expect(new Set(quiz.map((x) => x.id)).size).toBe(21);
    expect(quiz.filter((x) => x.course === "a")).toHaveLength(11);
    expect(quiz.filter((x) => x.course === "b")).toHaveLength(10);
  });

  it("gives a different quiz each attempt", () => {
    const one = buildQuiz({ total: 20, courses, rng: seededRng(1) }).map((x) => x.id).join();
    const two = buildQuiz({ total: 20, courses, rng: seededRng(2) }).map((x) => x.id).join();
    expect(one).not.toBe(two);
  });

  it("uses at most one question of a repeated pair", () => {
    const pair = [["a-1", "b-1"]];
    for (let seed = 1; seed <= 30; seed++) {
      const quiz = buildQuiz({ total: 80, courses, duplicates: pair, rng: seededRng(seed) });
      const ids = quiz.map((x) => x.id);
      expect(ids.filter((id) => id === "a-1" || id === "b-1").length).toBeLessThanOrEqual(1);
      expect(quiz).toHaveLength(79); // 80 asked, 79 distinct questions exist
    }
  });

  it("builds a quiz from the real data and keeps every answer correct", () => {
    const dir = join(process.cwd(), "public", "data");
    const manifest: Manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
    const load = (file: string): CourseData => JSON.parse(readFileSync(join(dir, file), "utf8"));
    const picks = manifest.courses.filter((c) => ["dsa", "os", "toa"].includes(c.id));
    const real = picks.map((c) => ({ id: c.id, weight: 1, questions: load(c.file).questions }));
    const byId = new Map(real.flatMap((c) => c.questions.map((x) => [x.id, x])));

    const quiz = buildQuiz({ total: 60, courses: real, duplicates: manifest.duplicates, rng: seededRng(99) });
    expect(quiz).toHaveLength(60);
    for (const item of quiz) {
      const original = byId.get(item.id)!;
      expect(item.options[item.answer]).toBe(original.o[original.a]);
    }
  });
});

describe("scoreQuiz", () => {
  it("counts correct, wrong and skipped, per course and unit", () => {
    const quiz = buildQuiz({ total: 4, courses: [{ id: "a", weight: 1, questions: many("a", 4) }], rng: seededRng(3) });
    const [q1, q2, q3] = quiz;
    const s = scoreQuiz(quiz, { [q1.id]: q1.answer, [q2.id]: (q2.answer + 1) % 4, [q3.id]: null });
    expect(s).toMatchObject({ total: 4, correct: 1, wrong: 1, skipped: 2, percent: 25 });
    expect(s.byCourse.a).toEqual({ total: 4, correct: 1, wrong: 1, skipped: 2 });
    expect(s.byUnit["a:1"].total).toBe(4);
    expect(s.wrongIds).toEqual([q2.id]);
    expect(s.skippedIds).toHaveLength(2);
  });
});
