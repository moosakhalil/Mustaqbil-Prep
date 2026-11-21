import type { PracticeSource } from "@/lib/guide/types";
import { loadFresh } from "@/lib/fresh";
import { newId } from "@/lib/id";
import { manifest } from "@/lib/manifest";
import { isMilitaryCourse, militaryTitle } from "@/lib/military";
import { bankById } from "@/lib/military-data";
import { loadCourse } from "@/lib/question-loader";
import { createAttempt } from "./attempt-logic";
import { buildQuiz } from "./build";
import { beginAttempt } from "./library";
import { repeatedTextGroups } from "./repeats";
import { setPlan } from "./settings";

/** How many questions "Try questions" gives at the end of a lesson: a quick check, not a full quiz. */
export const TRY_COUNT = 3;

/**
 * Start a short practice quiz (no timer) on the topic of a lesson. It is practice for the course, but it is not one of the three parts,
 * so a few questions never change the student's Readiness. "blocked" means three quizzes are already saved: a window asks which to remove.
 */
export async function startLessonPractice(o: { title: string; course: string; source: PracticeSource }): Promise<"started" | "blocked" | "failed"> {
  const bank = bankById(o.source.bank);
  if (!bank) return "failed";
  const wanted = o.source.units ? new Set(o.source.units) : null;
  const all = await loadCourse(bank.code);
  const questions = wanted ? all.filter((q) => wanted.has(q.u)) : all;
  if (questions.length === 0) return "failed";

  const pools = [{ id: bank.code, weight: 1, questions }];
  const fresh = await loadFresh();
  const quiz = buildQuiz({ total: Math.min(TRY_COUNT, questions.length), courses: pools, duplicates: [...manifest.duplicates, ...repeatedTextGroups(pools)], fresh });
  if (quiz.length === 0) return "failed";

  const course = isMilitaryCourse(o.course) ? o.course : undefined;
  const attempt = createAttempt({
    id: newId(), planId: `guide-${newId()}`, label: `${course ? `${militaryTitle(course)} · ` : ""}${o.title}`, mode: "practice", minutes: 0,
    questions: quiz, now: Date.now(), militaryCourse: course,
  });
  setPlan(null);
  return beginAttempt(attempt);
}
