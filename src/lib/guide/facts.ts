import type { Question } from "@/lib/question-types";
import type { QuizQuestion } from "@/lib/quiz/build";

// Helpers that turn the question banks into the guide's "past questions and answers" lists and worked figure examples.
// Everything shown comes from the bank, so the guide cannot disagree with the quiz.

/** Sentences in a bank explanation that say where a question came from. They are not part of the explanation a student needs. */
const SOURCE_NOTE = /(past repeated pma lc question|past pma lc question|practice question written by claude|recalled by candidates|shared by the owner|taken from the practice book)/i;

/** The explanation without the "where this question came from" sentences. */
export function cleanExplanation(e: string): string {
  return e
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s && !SOURCE_NOTE.test(s))
    .join(" ")
    .trim();
}

/** How many times a PMA question was listed in past tests ("Past repeated PMA LC question, listed 3 times."), or null when the bank does not say. */
export function timesListed(e: string): number | null {
  const m = /listed (\d+) times?/i.exec(e);
  return m ? Number(m[1]) : null;
}

export type Fact = { id: string; question: string; answer: string; why: string; times: number | null };

/**
 * One line per text question: the question, the right answer, a short reason when the bank has one, and how many times it was listed.
 * Picture questions have no text and are left out. When the bank records how often a question was listed, the most repeated come first.
 */
export function toFacts(questions: readonly Question[]): Fact[] {
  const facts = questions
    .filter((q) => q.q.trim() && !q.oimg)
    .map((q) => ({ id: q.id, question: q.q.trim(), answer: String(q.o[q.a] ?? ""), why: cleanExplanation(q.e ?? ""), times: timesListed(q.e ?? "") }));
  if (!facts.some((f) => f.times !== null)) return facts;
  // Array.sort is stable, so questions listed the same number of times keep the bank's order
  return [...facts].sort((a, b) => (b.times ?? 0) - (a.times ?? 0));
}

/** The facts whose question or answer contains every word typed (any case). An empty search keeps them all. */
export function filterFacts(facts: readonly Fact[], search: string): Fact[] {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...facts];
  return facts.filter((f) => {
    const text = `${f.question} ${f.answer}`.toLowerCase();
    return words.every((w) => text.includes(w));
  });
}

/** How many questions of a bank have text matching a fact group's pattern (a regular expression written as text, matched without regard to case). */
export function countMatching(questions: readonly Question[], pattern: string): number {
  let re: RegExp;
  try {
    re = new RegExp(pattern, "i");
  } catch {
    return 0;
  }
  return questions.filter((q) => re.test(q.q)).length;
}

/** A bank question in the shape the quiz figures use, so the quiz's own figure and option tiles can show it. */
export function toQuizQuestion(q: Question, course: string): QuizQuestion {
  return {
    id: q.id, course, unit: q.u, q: q.q, options: [...q.o], answer: q.a, explanation: q.e,
    ...(q.img ? { img: q.img } : {}), ...(q.oimg ? { optionImages: q.oimg } : {}),
  };
}
