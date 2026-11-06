import { newId } from "@/lib/id";
import { manifest } from "@/lib/manifest";
import { loadQuestionsById } from "@/lib/question-loader";
import { createAttempt } from "./attempt-logic";
import { setAttempt } from "./attempt";
import { buildQuiz } from "./build";
import { courseCapacities, type Selection } from "./selection-logic";
import { setPlan } from "./settings";
import { DEFAULT_SETTINGS, makePlan } from "./settings-logic";

/** A selection of every chapter of the given courses. */
export function wholeCourses(ids: readonly string[]): Selection {
  return Object.fromEntries(manifest.courses.filter((c) => ids.includes(c.id)).map((c) => [c.id, c.units.map((u) => u.n)]));
}

/** Set up a practice quiz without the settings screen (tiles, Daily 10, weak topics). Returns false when nothing could be built. */
export function startQuick(selection: Selection, count: number, mode: "practice" | "exam" = "practice"): boolean {
  const caps = courseCapacities(selection, manifest.courses);
  const plan = makePlan(selection, { ...DEFAULT_SETTINGS, count, mode }, caps, newId());
  if (!plan) return false;
  setPlan(plan);
  return true;
}

/** A practice quiz from specific questions (the wrong-answer notebook or bookmarks), in random order. */
export async function startFromQuestionIds(ids: readonly string[], label: string, max = 20): Promise<boolean> {
  const questions = await loadQuestionsById(ids);
  if (questions.length === 0) return false;
  const byCourse = new Map<string, typeof questions>();
  for (const q of questions) byCourse.set(q.id.slice(0, q.id.lastIndexOf("-")), [...(byCourse.get(q.id.slice(0, q.id.lastIndexOf("-"))) ?? []), q]);
  const quiz = buildQuiz({
    total: Math.min(max, questions.length),
    courses: [...byCourse].map(([id, qs]) => ({ id, weight: qs.length, questions: qs })),
    duplicates: manifest.duplicates,
  });
  setPlan(null);
  setAttempt(createAttempt({ id: newId(), planId: `ids-${newId()}`, label, mode: "practice", minutes: 0, questions: quiz, now: Date.now() }));
  return true;
}
