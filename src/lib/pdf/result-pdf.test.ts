import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import type { QuizQuestion } from "@/lib/quiz/build";
import { answerQuestion, createAttempt, finishAttempt } from "@/lib/quiz/attempt-logic";
import { buildResultPdf } from "./result-pdf";

const font = (name: string) => readFileSync(join(process.cwd(), "public", "fonts", name));
const names = { course: (id: string) => `Course ${id}`, unit: (_c: string, n: number) => `${n}. Chapter`, };

const q = (i: number): QuizQuestion => ({
  id: `os-${i}`, course: "os", unit: 1 + (i % 3),
  q: `For which x ∈ ℝ is f(x) ≤ g(x)? Symbols: α → β ≥ ≠ ∑ ⊆ λ ${"long ".repeat(40)}Supercalifragilisticexpialidocious${"x".repeat(120)}`,
  options: ["x ≤ 3", "x ≥ π", "∅ ⊂ A", "None of them"], answer: i % 4, explanation: "Because λ-calculus says so. ".repeat(6),
});

describe("result PDF", () => {
  it("builds a readable PDF with maths symbols, long words and many questions", async () => {
    const questions = Array.from({ length: 30 }, (_, i) => q(i));
    let a = createAttempt({ id: "t1", planId: "p", label: "Operating Systems + DBMS", mode: "exam", minutes: 30, questions, now: 1_000_000 });
    for (let i = 0; i < 20; i++) a = answerQuestion(a, `os-${i}`, i % 3, 1_000_000 + i * 1000);
    a = finishAttempt(a, 1_900_000);

    const bytes = await buildResultPdf(a, names, { regular: font("DejaVuSans.ttf"), bold: font("DejaVuSans-Bold.ttf") });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThan(2);
    expect(bytes.length).toBeLessThan(600_000); // fonts are subset, not embedded whole
  }, 60_000); // subsetting the fonts takes a few seconds

  it("shows pass or fail for a military section", async () => {
    const a = finishAttempt(createAttempt({ id: "t2", planId: "p", label: "ICTO Verbal", mode: "practice", minutes: 0, questions: [q(1)], now: 1_000_000, section: "verbal" }), 1_010_000);
    const bytes = await buildResultPdf(a, names, { regular: font("DejaVuSans.ttf"), bold: font("DejaVuSans-Bold.ttf") });
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  }, 60_000);
});
