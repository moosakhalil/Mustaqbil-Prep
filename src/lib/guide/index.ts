import { isMilitaryCourse, type MilitaryCourseId } from "@/lib/military";
import { bankById } from "@/lib/military-data";
import type { Score, Tally } from "@/lib/quiz/score";
import { plainFact } from "./markup";
import { NONVERBAL_LESSONS, NONVERBAL_LESSON_IDS } from "./nonverbal";
import { PMA_LESSONS } from "./pma";
import { SSC_LESSONS } from "./ssc";
import type { Block, GuideGroupId, Lesson, PracticeSource, Step } from "./types";
import { VERBAL_LESSONS } from "./verbal";

export type { Block, GuideGroupId, Lesson, PracticeSource, Step } from "./types";
export { TIPS_BLOCKS } from "./tips";

// The Study guide in one place: the groups, the lessons in the order the lists show them, which lesson helps with which quiz question,
// and the small helpers the pages, the quiz bulb and the AI helper share.

/** The four parts of the guide, with the words the lists use. */
export const GROUPS: Record<GuideGroupId, { title: string; hint: string }> = {
  verbal: { title: "Verbal tricks", hint: "Percentages, days, speed, ages" },
  nonverbal: { title: "Non-verbal patterns", hint: `${NONVERBAL_LESSONS.length} chapters of picture puzzles` },
  ssc: { title: "Academic · SSC", hint: "ICTO · LCC · Navy IT · PAF IT" },
  pma: { title: "Academic · PMA Long Course", hint: "Its own repeated subjects" },
};

export const GROUP_IDS = Object.keys(GROUPS) as GuideGroupId[];
export const isGroupId = (x: unknown): x is GuideGroupId => typeof x === "string" && x in GROUPS;

/** The four courses that share the SSC past-paper banks. */
export const SSC_COURSES = ["icto", "lcc", "navy-it", "airforce-it"] as const;
const isSscCourse = (x: unknown): x is (typeof SSC_COURSES)[number] => SSC_COURSES.some((c) => c === x);

const BY_GROUP: Record<GuideGroupId, readonly Lesson[]> = { verbal: VERBAL_LESSONS, nonverbal: NONVERBAL_LESSONS, ssc: SSC_LESSONS, pma: PMA_LESSONS };

/** Every lesson, in no particular order. */
export const ALL_LESSONS: readonly Lesson[] = [...VERBAL_LESSONS, ...NONVERBAL_LESSONS, ...SSC_LESSONS, ...PMA_LESSONS];

/** A lesson's name for storing "read": group and id, for example "verbal/percentages". */
export const lessonKey = (l: Pick<Lesson, "group" | "id">) => `${l.group}/${l.id}`;
/**
 * A lesson's address. `back` is the screen to return to when the lesson was opened from inside a quiz or its review ("/quiz", "/quiz/review" or a saved
 * result's review). The lesson then offers a clear way back, and the link keeps it when the student moves to another lesson.
 */
export const lessonHref = (l: Pick<Lesson, "group" | "id">, back?: string) => {
  const safe = parseBack(back);
  return `/guide/${l.group}/${l.id}${safe ? `?back=${encodeURIComponent(safe)}` : ""}`;
};

/** The only screens a lesson may send a student back to: the quiz itself, or the review of a quiz. Anything else is ignored. */
const BACK_PATHS = /^\/(?:quiz|quiz\/review|results\/[A-Za-z0-9_-]{1,64}\/review)$/;
export function parseBack(value: unknown): string | undefined {
  return typeof value === "string" && BACK_PATHS.test(value) ? value : undefined;
}
export const groupHref = (g: GuideGroupId) => `/guide/${g}`;

const KEYS: ReadonlySet<string> = new Set(ALL_LESSONS.map(lessonKey));
export const isLessonKey = (x: unknown): x is string => typeof x === "string" && KEYS.has(x);

export const findLesson = (group: string, id: string): Lesson | undefined => ALL_LESSONS.find((l) => l.group === group && l.id === id);
export const findLessonByKey = (key: string): Lesson | undefined => ALL_LESSONS.find((l) => lessonKey(l) === key);

/**
 * The course whose questions a lesson uses. PMA lessons are always PMA LC. SSC lessons use the student's own course when it is one of the four (ICTO otherwise).
 * Verbal and Non-verbal use the student's course too (PMA LC has its own Verbal bank), ICTO when none is chosen.
 */
export function guideCourse(group: GuideGroupId, preferred: string | null | undefined): MilitaryCourseId {
  if (group === "pma") return "pma-lc";
  if (group === "ssc") return isSscCourse(preferred) ? preferred : "icto";
  return isMilitaryCourse(preferred) ? preferred : "icto";
}

/** Where "Try questions" takes its questions from for this course. `{course}` is filled in. */
export function practiceFor(l: Lesson, course: string): PracticeSource {
  const src = course === "pma-lc" && l.practice["pma-lc"] ? l.practice["pma-lc"] : l.practice.default;
  return { ...src, bank: src.bank.replace("{course}", isSscCourse(course) ? course : "icto") };
}

/** How many questions "Try questions" can draw from. 0 when the bank is missing. */
export function practiceCount(l: Lesson, course: string): number {
  const src = practiceFor(l, course);
  const bank = bankById(src.bank);
  if (!bank) return 0;
  const wanted = src.units ? new Set(src.units) : null;
  return bank.units.filter((u) => !wanted || wanted.has(u.n)).reduce((t, u) => t + u.count, 0);
}

/**
 * The number shown in the lists: how many past questions the lesson is about. For Verbal and Non-verbal that is its main chapter (the first unit);
 * for Academic it is the whole bank.
 */
export function pastCount(l: Lesson, course = "icto"): number {
  const src = practiceFor(l, course);
  const bank = bankById(src.bank);
  if (!bank) return 0;
  const first = src.units?.[0];
  return first === undefined ? bank.total : bank.units.find((u) => u.n === first)?.count ?? 0;
}

const PIN_FIRST = "most-repeated";

/** The lessons of one group in list order: biggest topic first (Non-verbal keeps its chapter order, the PMA "Most repeated set" always leads). */
export function lessonsOf(group: GuideGroupId): Lesson[] {
  const list = [...BY_GROUP[group]];
  if (group === "nonverbal") return list;
  return list.sort((a, b) => Number(b.id === PIN_FIRST) - Number(a.id === PIN_FIRST) || pastCount(b) - pastCount(a) || a.title.localeCompare(b.title));
}

/** The lesson after this one in its list, or undefined at the end. */
export function nextLesson(l: Lesson): Lesson | undefined {
  const list = lessonsOf(l.group);
  return list[list.findIndex((x) => x.id === l.id) + 1];
}

export type ListSection = { heading: string; lessons: Lesson[] };

/** How many topics sit under "Must learn" at the top of a ranked list. */
export const MUST_LEARN_COUNT = 3;

/**
 * A list split under plain headings, so no row needs a tag: "Must learn" over the biggest three and "Then" over the rest (Verbal, SSC);
 * "Start here" over the PMA Most repeated set and "Subjects" over the rest; "Chapters" for Non-verbal, which is not ranked.
 */
export function listSections(group: GuideGroupId): ListSection[] {
  const list = lessonsOf(group);
  const sections: ListSection[] =
    group === "nonverbal"
      ? [{ heading: "Chapters", lessons: list }]
      : group === "pma"
        ? [{ heading: "Start here", lessons: list.filter((l) => l.id === PIN_FIRST) }, { heading: "Subjects", lessons: list.filter((l) => l.id !== PIN_FIRST) }]
        : [{ heading: "Must learn", lessons: list.slice(0, MUST_LEARN_COUNT) }, { heading: "Then", lessons: list.slice(MUST_LEARN_COUNT) }];
  return sections.filter((s) => s.lessons.length > 0);
}

/**
 * The lesson to offer next: the first one not yet read, going through Verbal, Non-verbal, then the student's own Academic part, then the other one.
 * Undefined when every lesson has been read.
 */
export function nextUnreadLesson(read: ReadonlySet<string>, preferred: string | null | undefined): Lesson | undefined {
  const academic: GuideGroupId[] = preferred === "pma-lc" ? ["pma", "ssc"] : ["ssc", "pma"];
  for (const group of ["verbal", "nonverbal", ...academic] as GuideGroupId[]) {
    const lesson = lessonsOf(group).find((l) => !read.has(lessonKey(l)));
    if (lesson) return lesson;
  }
  return undefined;
}

// ---- jump links on a long lesson ----

/** The address of a lesson section, used by the section itself and by the "On this page" links. */
export const sectionId = (index: number) => `part-${index}`;

/** The sections of a lesson that "On this page" can jump to, in order. A lesson with fewer than 4 sections gets no links: it fits on a screen or two. */
export function jumpLinks(blocks: readonly Block[]): { id: string; label: string }[] {
  const links = blocks.map((b, i) => ({ id: sectionId(i), label: b.kind === "watch" ? "Watch out" : b.title }));
  return links.length >= 4 ? links : [];
}

// ---- which lesson helps with which quiz question ----

/** Verbal bank chapter (unit) -> lesson ids. The first id is the main one. Units 8 to 13 are the "Past repeated" chapters; 1 to 7 are practice chapters. */
const VERBAL_UNIT_LESSONS: Record<number, string[]> = {
  1: ["odd-one-out-words"],
  2: ["directions-letters-series"],
  3: ["directions-letters-series"],
  4: ["directions-letters-series"],
  5: ["ages-relations", "directions-letters-series"],
  6: ["odd-one-out-words", "ages-relations"],
  7: ["odd-one-out-words"],
  8: ["days-dates"],
  9: ["percentages"],
  10: ["speed-time-work"],
  11: ["ages-relations"],
  12: ["directions-letters-series"],
  13: ["odd-one-out-words"],
};

/** PMA LC's own Verbal bank, chapter -> lesson id. */
const PMA_VERBAL_UNIT_LESSONS: Record<number, string[]> = {
  1: ["days-dates"],
  2: ["percentages"],
  3: ["speed-time-work"],
  4: ["ages-relations"],
  5: ["directions-letters-series"],
  6: ["odd-one-out-words"],
};

const SSC_BANK = /^mil-academic-(?:icto|lcc|navy-it|airforce-it)-(pp-)?(.+)$/;
const PMA_BANK = /^mil-academic-pma-lc-(.+)$/;

function pick(group: GuideGroupId, ids: readonly string[]): Lesson[] {
  return ids.map((id) => BY_GROUP[group].find((l) => l.id === id)).filter((l): l is Lesson => !!l);
}

/**
 * The lessons that help with a quiz question, main one first. `course` is the question's bank id as a quiz holds it ("mil-verbal", "mil-nonverbal",
 * "mil-academic-icto-pp-subnetting" ...), `unit` its chapter. Empty when no lesson covers it (degree courses, Calculus, Probability, some practice chapters).
 */
export function lessonsForQuestion(course: string, unit: number): Lesson[] {
  if (course === "mil-verbal") return pick("verbal", VERBAL_UNIT_LESSONS[unit] ?? []);
  if (course === "mil-verbal-pma-lc") return pick("verbal", PMA_VERBAL_UNIT_LESSONS[unit] ?? []);
  if (course === "mil-nonverbal") return pick("nonverbal", NONVERBAL_LESSON_IDS[unit - 1] ? [NONVERBAL_LESSON_IDS[unit - 1]] : []);
  const pma = PMA_BANK.exec(course);
  if (pma) return pick("pma", [pma[1]]);
  const ssc = SSC_BANK.exec(course);
  if (ssc) {
    // the past-paper banks ("pp-...") and the Computer basics practice bank both belong to the Computer basics lesson
    const [, isPastPaper, topic] = ssc;
    return pick("ssc", isPastPaper || topic === "computer-basics" ? [topic] : []);
  }
  return [];
}

/** The steps of "The trick" (the first steps block), or none. */
export function trickSteps(l: Lesson): Step[] {
  const block = l.blocks.find((b): b is Extract<Block, { kind: "steps" }> => b.kind === "steps");
  return block?.steps ?? [];
}

// ---- after a quiz: which lessons to read first ----

export type WeakLesson = { lesson: Lesson; correct: number; total: number; percent: number };

/** Below this percent a lesson counts as weak (the "Strong" mark on the result screen starts at 70). */
export const WEAK_BELOW = 70;

/**
 * The lessons behind the chapters of a finished quiz, weakest first. A chapter counts for its main lesson; chapters of the same lesson are added together.
 * Only lessons under {@link WEAK_BELOW} percent are returned.
 */
export function weakLessons(score: Pick<Score, "byUnit">): WeakLesson[] {
  const totals = new Map<string, { lesson: Lesson; tally: Pick<Tally, "correct" | "total"> }>();
  for (const [key, tally] of Object.entries(score.byUnit)) {
    const at = key.lastIndexOf(":");
    const lesson = lessonsForQuestion(key.slice(0, at), Number(key.slice(at + 1)))[0];
    if (!lesson) continue;
    const t = totals.get(lessonKey(lesson)) ?? { lesson, tally: { correct: 0, total: 0 } };
    t.tally.correct += tally.correct;
    t.tally.total += tally.total;
    totals.set(lessonKey(lesson), t);
  }
  return [...totals.values()]
    .map(({ lesson, tally }) => ({ lesson, correct: tally.correct, total: tally.total, percent: tally.total === 0 ? 0 : Math.round((tally.correct / tally.total) * 100) }))
    .filter((w) => w.total > 0 && w.percent < WEAK_BELOW)
    .sort((a, b) => a.percent - b.percent || b.total - a.total);
}

// ---- the card on a part's start page ----

export type GuideStartCard = { title: string; hint: string; href: string };

/** The card above the question choices on the start page of a part (Verbal, Non-verbal, Academic), pointing to the matching part of the guide. */
export function guideStartCard(course: string, section: "verbal" | "nonverbal" | "academic"): GuideStartCard {
  if (section === "verbal") return { title: "Tricks and formulas", hint: "Percentages, days, speed, ages", href: groupHref("verbal") };
  if (section === "nonverbal") return { title: "How to solve picture puzzles", hint: `${NONVERBAL_LESSONS.length} chapters · short lessons`, href: groupHref("nonverbal") };
  if (course === "pma-lc") return { title: "Quick facts for these subjects", hint: "Dates, names and lists", href: groupHref("pma") };
  return { title: "Most repeated topics", hint: "Subnetting, security, networks and more", href: groupHref("ssc") };
}

// ---- the AI helper ----

/**
 * The AI helper (Simpler, Another example, Quiz me) works from a lesson's written steps and facts, so it shows on Verbal and SSC Academic lessons.
 * Not on Non-verbal (a picture example cannot be made in words) and not on PMA quick facts (a list of facts has no trick to explain).
 */
export const hasAiHelper = (l: Lesson): boolean => (l.group === "verbal" || l.group === "ssc") && l.blocks.some((b) => b.kind === "steps" || b.kind === "facts");

/** A lesson as plain text, so the AI helper explains what the lesson says and does not invent its own. The long past-question lists are left out. */
export function lessonText(l: Lesson): string {
  const out: string[] = [`Lesson: ${l.title}`, l.summary];
  for (const b of l.blocks) {
    if (b.kind === "steps") out.push(b.title, ...b.steps.map((s, i) => `${i + 1}. ${s.head} ${s.text}`));
    else if (b.kind === "text") out.push(b.title, ...b.paragraphs);
    else if (b.kind === "examples") out.push(b.title, ...b.items.map((e) => `Q: ${e.prompt} Working: ${e.lines.join(" ")} Answer: ${e.answer}`));
    else if (b.kind === "table") out.push(b.title, b.head.join(" | "), ...b.rows.map((r) => r.join(" | ")), ...(b.note ? [b.note] : []));
    else if (b.kind === "watch") out.push(`Watch out: ${b.text}`);
    else if (b.kind === "facts") out.push(b.title, ...b.groups.flatMap((g) => [g.title, ...g.facts.map(plainFact)]));
  }
  return out.join("\n");
}
