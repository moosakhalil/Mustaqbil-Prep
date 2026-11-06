import { describe, expect, it } from "vitest";
import { buildQuiz } from "./quiz/build";
import { seededRng } from "./quiz/random";
import { pickFresh, seenKey, type Fresh } from "./fresh-logic";

const qs = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `x-${i + 1}`, u: 1, q: `Question ${i + 1}`, o: ["a", "b", "c", "d"], a: 0, e: "" }));
const none: Fresh = { seen: {}, wrong: new Set() };

describe("fresh questions first", () => {
  it("takes unseen questions before seen ones", () => {
    const pool = qs(20);
    const seen = Object.fromEntries(pool.slice(0, 10).map((q) => [q.id, [1, 100] as [number, number]]));
    for (let s = 1; s <= 20; s++) {
      const got = pickFresh(pool, 10, { seen, wrong: new Set() }, seededRng(s));
      expect(got).toHaveLength(10);
      expect(got.every((q) => !seen[q.id])).toBe(true);
    }
  });

  it("brings back about 1 in 5 from the wrong notebook", () => {
    const pool = qs(50);
    const wrong = new Set(["x-1", "x-2", "x-3", "x-4", "x-5", "x-6", "x-7", "x-8"]);
    const seen = Object.fromEntries([...wrong].map((id) => [id, [1, 100] as [number, number]]));
    const got = pickFresh(pool, 20, { seen, wrong }, seededRng(3));
    expect(got).toHaveLength(20);
    expect(got.filter((q) => wrong.has(q.id))).toHaveLength(4);
    expect(new Set(got.map((q) => q.id)).size).toBe(20);
  });

  it("reuses the questions seen longest ago when the new ones run out", () => {
    const pool = qs(6);
    const seen = { "x-1": [1, 50], "x-2": [1, 10], "x-3": [1, 90], "x-4": [1, 20], "x-5": [1, 70], "x-6": [1, 30] } as Record<string, [number, number]>;
    const got = pickFresh(pool, 3, { seen, wrong: new Set() }, seededRng(1)).map((q) => q.id).sort();
    expect(got).toEqual(["x-2", "x-4", "x-6"]); // days 10, 20, 30
  });

  it("gives every question when asked for more than the pool holds, without repeats", () => {
    const got = pickFresh(qs(5), 9, none, seededRng(2));
    expect(got).toHaveLength(5);
  });

  it("treats the shared military banks of every course as the same question", () => {
    expect(seenKey("mil-academic-icto-pp-networks-12")).toBe(seenKey("mil-academic-navy-it-pp-networks-12"));
    expect(seenKey("dsa-12")).toBe("dsa-12");
  });

  it("works inside buildQuiz: a second test after a first one is mostly new", () => {
    const pool = [{ id: "x", weight: 1, questions: qs(100) }];
    const first = buildQuiz({ total: 40, courses: pool, rng: seededRng(5), fresh: none });
    const seen = Object.fromEntries(first.map((q) => [q.id, [1, 100] as [number, number]]));
    const second = buildQuiz({ total: 40, courses: pool, rng: seededRng(6), fresh: { seen, wrong: new Set() } });
    expect(second.filter((q) => seen[q.id])).toHaveLength(0);
  });
});
