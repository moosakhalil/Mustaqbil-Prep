import type { Question } from "@/lib/question-types";
import { pickFresh, type Fresh } from "@/lib/fresh-logic";
import { allocate } from "./mix";
import { shuffled, type Rng } from "./random";

/** One question as the student sees it in a quiz: options already shuffled, answer is an index into `options`. */
export type QuizQuestion = {
  id: string;
  course: string;
  unit: number;
  q: string;
  options: string[];
  answer: number;
  explanation: string;
  /** Question figure and option figures for image questions (Non-verbal). Option figures keep their numbered order. */
  img?: string;
  optionImages?: string[];
};

export type PoolCourse = {
  id: string;
  /** Share of the quiz (percentage). Use the same number for every course for an even split. */
  weight: number;
  /** Questions of the chosen chapters only. */
  questions: readonly Question[];
};

/** Shuffle the options of one question. Options such as "None of these" (listed in `p`) stay last, in their original order. */
export function shuffleOptions(question: Question, rng?: Rng): { options: string[]; answer: number } {
  // image options are numbered figures: they keep their order
  if (question.oimg) return { options: [...question.o], answer: question.a };
  const pinned = new Set(question.p ?? []);
  const free = question.o.map((_, i) => i).filter((i) => !pinned.has(i));
  const order = [...shuffled(free, rng), ...(question.p ?? [])];
  const options = order.map((i) => question.o[i]);
  // follow the option itself, not its position
  return { options, answer: order.indexOf(question.a) };
}

/**
 * Build a quiz: pick the number of questions per course, pick them at random without repeats, then shuffle the
 * question order and every question's options.
 * `duplicates` are groups of question ids with the same text; at most one of each group is used.
 */
export function buildQuiz(opts: {
  total: number;
  courses: readonly PoolCourse[];
  duplicates?: readonly (readonly string[])[];
  rng?: Rng;
  /** When given, questions the person has not seen are taken first and about 1 in 5 come from their wrong notebook. */
  fresh?: Fresh | null;
}): QuizQuestion[] {
  const { total, courses, duplicates = [], rng, fresh } = opts;

  // keep one random member of every repeated question, drop the others from their pools
  const drop = new Set<string>();
  const inPool = new Set(courses.flatMap((c) => c.questions.map((q) => q.id)));
  for (const group of duplicates) {
    const present = group.filter((id) => inPool.has(id));
    if (present.length > 1) {
      const keep = shuffled(present, rng)[0];
      present.filter((id) => id !== keep).forEach((id) => drop.add(id));
    }
  }
  const pools = courses.map((c) => ({ ...c, questions: c.questions.filter((q) => !drop.has(q.id)) }));

  const counts = allocate(
    total,
    pools.map((c) => ({ id: c.id, capacity: c.questions.length, weight: c.weight })),
  );

  const picked: QuizQuestion[] = [];
  for (const c of pools) {
    const chosen = fresh ? pickFresh(c.questions, counts[c.id], fresh, rng) : shuffled(c.questions, rng).slice(0, counts[c.id]);
    for (const q of chosen) {
      picked.push({
        id: q.id, course: c.id, unit: q.u, q: q.q, ...shuffleOptions(q, rng), explanation: q.e,
        ...(q.img ? { img: q.img } : {}), ...(q.oimg ? { optionImages: q.oimg } : {}),
      });
    }
  }
  return shuffled(picked, rng);
}
