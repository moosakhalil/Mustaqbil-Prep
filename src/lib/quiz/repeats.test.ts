import { describe, expect, it } from "vitest";
import { buildQuiz } from "./build";
import { repeatedTextGroups } from "./repeats";

const q = (id: string, text: string) => ({ id, u: 1, q: text, o: ["a", "b", "c", "d"], a: 0, e: "" });

describe("same question in two banks", () => {
  const pools = [
    { id: "x", weight: 1, questions: [q("x-1", "What does HTML stand for?"), q("x-2", "What is a stack?")] },
    { id: "y", weight: 1, questions: [q("y-1", "what does HTML stand for"), q("y-2", "What is a queue?")] },
  ];

  it("finds the questions with the same text, ignoring case and punctuation", () => {
    expect(repeatedTextGroups(pools)).toEqual([["x-1", "y-1"]]);
  });

  it("never puts the same question twice in one quiz", () => {
    for (let i = 0; i < 30; i++) {
      const quiz = buildQuiz({ total: 4, courses: pools, duplicates: repeatedTextGroups(pools) });
      const texts = quiz.map((x) => x.q.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim());
      expect(new Set(texts).size).toBe(texts.length);
    }
  });
});
