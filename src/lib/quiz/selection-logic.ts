import type { CourseInfo } from "@/lib/question-types";

/** Course id -> the chapter (unit) numbers ticked in it. A course with no ticked chapter is not in the map. */
export type Selection = Record<string, number[]>;

export type CheckState = "none" | "some" | "all";

const sortNums = (a: number[]) => [...a].sort((x, y) => x - y);

export function courseState(sel: Selection, course: Pick<CourseInfo, "id" | "units">): CheckState {
  const n = sel[course.id]?.length ?? 0;
  return n === 0 ? "none" : n >= course.units.length ? "all" : "some";
}

/** Tick one chapter, or untick it if it is ticked. */
export function toggleUnit(sel: Selection, courseId: string, unit: number): Selection {
  const current = sel[courseId] ?? [];
  const next = current.includes(unit) ? current.filter((u) => u !== unit) : sortNums([...current, unit]);
  const { [courseId]: _old, ...rest } = sel;
  void _old;
  return next.length ? { ...rest, [courseId]: next } : rest;
}

/** Tick a whole course. If every chapter is already ticked, untick the course instead. Partly ticked becomes fully ticked. */
export function toggleCourse(sel: Selection, course: Pick<CourseInfo, "id" | "units">): Selection {
  const { [course.id]: _old, ...rest } = sel;
  void _old;
  return courseState(sel, course) === "all" ? rest : { ...rest, [course.id]: course.units.map((u) => u.n) };
}

/** Tick the given chapters (used by "Select all", also while a search is showing only some of them). */
export function selectMany(sel: Selection, items: readonly { id: string; units: readonly number[] }[]): Selection {
  const next: Selection = { ...sel };
  for (const item of items) {
    const merged = new Set([...(next[item.id] ?? []), ...item.units]);
    if (merged.size) next[item.id] = sortNums([...merged]);
  }
  return next;
}

export type Summary = { courses: number; chapters: number; questions: number };

/** Running totals for the sticky bar. Unknown courses or chapters (old saved picks) are ignored. */
export function summarize(sel: Selection, courses: readonly CourseInfo[]): Summary {
  let chapters = 0;
  let questions = 0;
  let used = 0;
  for (const c of courses) {
    const picked = new Set(sel[c.id] ?? []);
    const units = c.units.filter((u) => picked.has(u.n));
    if (units.length) used++;
    chapters += units.length;
    questions += units.reduce((s, u) => s + u.count, 0);
  }
  return { courses: used, chapters, questions };
}

/** One entry per course that has ticked chapters: how many chapters, and how many questions it can give. */
export type CourseCap = { id: string; title: string; chapters: number; capacity: number };

export function courseCapacities(sel: Selection, courses: readonly CourseInfo[]): CourseCap[] {
  const caps: CourseCap[] = [];
  for (const c of courses) {
    const picked = new Set(sel[c.id] ?? []);
    const units = c.units.filter((u) => picked.has(u.n));
    if (units.length) caps.push({ id: c.id, title: c.title, chapters: units.length, capacity: units.reduce((s, u) => s + u.count, 0) });
  }
  return caps;
}

/** Drop anything that is not a real course/chapter in the current data (e.g. saved before the data changed). */
export function sanitize(value: unknown, courses: readonly CourseInfo[]): Selection {
  if (!value || typeof value !== "object") return {};
  const out: Selection = {};
  for (const c of courses) {
    const raw = (value as Record<string, unknown>)[c.id];
    if (!Array.isArray(raw)) continue;
    const valid = new Set(c.units.map((u) => u.n));
    const units = sortNums([...new Set(raw.filter((n): n is number => Number.isInteger(n) && valid.has(n)))]);
    if (units.length) out[c.id] = units;
  }
  return out;
}
