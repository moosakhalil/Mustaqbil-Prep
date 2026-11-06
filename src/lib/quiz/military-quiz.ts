import { loadFresh } from "@/lib/fresh";
import { newId } from "@/lib/id";
import { manifest } from "@/lib/manifest";
import { SECTIONS, militaryTitle, type SectionId } from "@/lib/military";
import { intelligenceBank, subjectCount, type SubjectRow } from "@/lib/military-data";
import { degreeWeight, militaryFileWeight } from "@/lib/military-suggest";
import { loadCourse } from "@/lib/question-loader";
import { createAttempt, type Attempt } from "./attempt-logic";
import { setAttempt } from "./attempt";
import { buildQuiz, type PoolCourse } from "./build";
import { repeatedTextGroups } from "./repeats";
import { setPlan } from "./settings";
import type { Mode } from "./settings-logic";

/** How many questions a part can give right now, from the data in the app. */
export function sectionAvailable(section: SectionId, subjects: readonly SubjectRow[]): number {
  if (section === "academic") return subjects.reduce((t, s) => t + subjectCount(s), 0);
  return intelligenceBank(section)?.total ?? 0;
}

/** The question pools of one part. Academic subjects from degree banks point at the bank (nothing is copied). */
export async function loadSectionPools(section: SectionId, subjects: readonly SubjectRow[]): Promise<PoolCourse[]> {
  if (section !== "academic") {
    const bank = intelligenceBank(section);
    if (!bank) return [];
    const questions = await loadCourse(bank.code);
    return [{ id: bank.code, weight: questions.length, questions }];
  }

  // one pool per source bank, weighted by how often that topic appears in past questions (not by bank size); two subjects on the same degree course are merged (all chapters wins over some chapters)
  const wanted = new Map<string, Set<number> | null>();
  for (const s of subjects) {
    const id = s.source === "military" ? `mil-${s.militaryFile}` : s.degreeCourse;
    if (!id) continue;
    const units = s.source === "military" ? null : s.units ? new Set(s.units) : null;
    const before = wanted.get(id);
    wanted.set(id, before === undefined ? units : before === null || units === null ? null : new Set([...before, ...units]));
  }
  const pools: PoolCourse[] = [];
  for (const [id, units] of wanted) {
    if (!id.startsWith("mil-") && !manifest.courses.some((c) => c.id === id)) continue;
    const all = await loadCourse(id);
    const questions = units ? all.filter((q) => units.has(q.u)) : all;
    if (questions.length) pools.push({ id, weight: id.startsWith("mil-") ? militaryFileWeight(id) : degreeWeight(id), questions });
  }
  return pools;
}

export type SectionOptions = {
  course: string;
  section: SectionId;
  subjects: readonly SubjectRow[];
  count: number;
  mode: Mode;
  minutes: number;
  mockId?: string;
};

export async function buildSectionAttempt(o: SectionOptions): Promise<Attempt | null> {
  const [pools, fresh] = await Promise.all([loadSectionPools(o.section, o.subjects), loadFresh()]);
  const available = pools.reduce((t, p) => t + p.questions.length, 0);
  const questions = buildQuiz({ total: Math.min(o.count, available), courses: pools, duplicates: [...manifest.duplicates, ...repeatedTextGroups(pools)], fresh });
  if (questions.length === 0) return null;
  const title = SECTIONS.find((s) => s.id === o.section)?.title ?? o.section;
  return createAttempt({
    id: newId(), planId: `mil-${newId()}`, label: `${militaryTitle(o.course)} · ${title}`, mode: o.mode, minutes: o.minutes,
    questions, now: Date.now(), section: o.section, militaryCourse: o.course, mockId: o.mockId,
  });
}

/** Start one military part as a quiz. Returns false when it has no questions. */
export async function startSection(o: SectionOptions): Promise<boolean> {
  const attempt = await buildSectionAttempt(o);
  if (!attempt) return false;
  setPlan(null);
  setAttempt(attempt);
  return true;
}

export type MixedOptions = {
  course: string;
  /** Verbal and/or Non-verbal, when ticked. */
  intelligence: readonly ("verbal" | "nonverbal")[];
  /** The Academic subjects that were ticked (may be empty). */
  subjects: readonly SubjectRow[];
  count: number;
  mode: Mode;
  minutes: number;
};

/** Weight of Verbal and of Non-verbal against the Academic subjects in a mixed quiz. */
const INTELLIGENCE_WEIGHT = 25;

/**
 * Practice with a free choice of parts: any mix of Verbal, Non-verbal and Academic subjects, like the Academia builder.
 * When only one part is involved the quiz counts as that part (so it feeds Readiness); a mix is plain practice for the course.
 */
export async function buildMixedAttempt(o: MixedOptions): Promise<Attempt | null> {
  const parts: SectionId[] = [...o.intelligence, ...(o.subjects.length ? (["academic"] as const) : [])];
  const [intel, academic, fresh] = await Promise.all([
    Promise.all(o.intelligence.map((id) => loadSectionPools(id, []))),
    o.subjects.length ? loadSectionPools("academic", o.subjects) : Promise.resolve([] as PoolCourse[]),
    loadFresh(),
  ]);
  const pools: PoolCourse[] = [...intel.flat().map((p) => ({ ...p, weight: INTELLIGENCE_WEIGHT })), ...academic];
  const available = pools.reduce((t, p) => t + p.questions.length, 0);
  const questions = buildQuiz({ total: Math.min(o.count, available), courses: pools, duplicates: [...manifest.duplicates, ...repeatedTextGroups(pools)], fresh });
  if (questions.length === 0) return null;
  const only = parts.length === 1 ? parts[0] : undefined;
  const title = only ? SECTIONS.find((s) => s.id === only)?.title ?? only : "Custom practice";
  return createAttempt({
    id: newId(), planId: `mil-${newId()}`, label: `${militaryTitle(o.course)} · ${title}`, mode: o.mode, minutes: o.minutes,
    questions, now: Date.now(), section: only, militaryCourse: o.course,
  });
}

export async function startMixed(o: MixedOptions): Promise<boolean> {
  const attempt = await buildMixedAttempt(o);
  if (!attempt) return false;
  setPlan(null);
  setAttempt(attempt);
  return true;
}
