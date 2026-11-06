import type { CourseInfo } from "@/lib/question-types";
import { allocate } from "./mix";
import { sanitize, type CourseCap, type Selection } from "./selection-logic";

export type Mode = "practice" | "exam";

/** What the student chose on the Quiz settings screen. Raw choices: the screen resolves them against the picked topics. */
export type Settings = {
  count: number;
  mode: Mode;
  mix: "even" | "custom";
  /** Course id -> percentage, used when mix is "custom". */
  percents: Record<string, number>;
  /** Exam time: "auto" is 1 minute per question, "custom" uses `minutes`. */
  timeMode: "auto" | "custom";
  minutes: number;
};

export const DEFAULT_SETTINGS: Settings = { count: 30, mode: "practice", mix: "even", percents: {}, timeMode: "auto", minutes: 30 };
export const PRESETS = [10, 20, 30, 50] as const;
export const MAX_MINUTES = 600;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Whole-number percentages that add up to exactly 100 (3 courses: 34, 33, 33). */
export function evenPercents(ids: readonly string[]): Record<string, number> {
  if (ids.length === 0) return {};
  const base = Math.floor(100 / ids.length);
  let extra = 100 - base * ids.length;
  return Object.fromEntries(ids.map((id) => [id, base + (extra-- > 0 ? 1 : 0)]));
}

/** Change one course's percentage. With exactly two courses the other one takes the rest, so the total stays 100. */
export function setPercent(percents: Record<string, number>, ids: readonly string[], id: string, value: number): Record<string, number> {
  const v = clamp(Math.round(value), 0, 100);
  if (ids.length === 2) {
    const other = ids.find((x) => x !== id)!;
    return { [id]: v, [other]: 100 - v };
  }
  return { ...Object.fromEntries(ids.map((x) => [x, percents[x] ?? 0])), [id]: v };
}

export type Resolved = {
  /** Most questions the picked topics can give. */
  max: number;
  /** The count that will be used (the choice, kept between 1 and max). */
  count: number;
  /** True when the choice was above max and had to be lowered. */
  clamped: boolean;
  percents: Record<string, number>;
  totalPercent: number;
  /** One course: always fine. Several: the percentages must add up to 100. */
  mixOk: boolean;
  /** Questions each course gives, exact total. */
  counts: Record<string, number>;
  /** Exam time in minutes (0 in practice mode). */
  minutes: number;
};

export function resolveSettings(s: Settings, caps: readonly CourseCap[]): Resolved {
  const max = caps.reduce((t, c) => t + c.capacity, 0);
  const wanted = Number.isFinite(s.count) ? Math.floor(s.count) : DEFAULT_SETTINGS.count;
  const count = max === 0 ? 0 : clamp(wanted, 1, max);
  const ids = caps.map((c) => c.id);

  const hasAll = ids.every((id) => typeof s.percents[id] === "number");
  const percents =
    s.mix === "custom" && hasAll
      ? Object.fromEntries(ids.map((id) => [id, clamp(Math.round(s.percents[id]), 0, 100)]))
      : evenPercents(ids);
  const totalPercent = ids.reduce((t, id) => t + percents[id], 0);

  const counts = allocate(
    count,
    caps.map((c) => ({ id: c.id, capacity: c.capacity, weight: percents[c.id] })),
  );
  const minutes = s.mode === "exam" ? (s.timeMode === "custom" ? clamp(Math.floor(s.minutes) || 1, 1, MAX_MINUTES) : Math.max(count, 1)) : 0;

  return { max, count, clamped: count !== wanted, percents, totalPercent, mixOk: ids.length < 2 || totalPercent === 100, counts, minutes };
}

/** Everything the quiz screen needs to build and run the quiz. */
export type QuizPlan = {
  /** New for every Start press, so the quiz screen knows when a fresh quiz is wanted. */
  id: string;
  selection: Selection;
  count: number;
  mode: Mode;
  /** Course id -> share of the quiz (percent). */
  weights: Record<string, number>;
  minutes: number;
};

/** Null when the quiz cannot start (nothing picked, or the mix does not add up to 100). */
export function makePlan(selection: Selection, s: Settings, caps: readonly CourseCap[], id: string): QuizPlan | null {
  const r = resolveSettings(s, caps);
  if (r.count < 1 || !r.mixOk) return null;
  const picked = Object.fromEntries(caps.map((c) => [c.id, selection[c.id]]));
  return { id, selection: picked, count: r.count, mode: s.mode, weights: r.percents, minutes: r.minutes };
}

export function sanitizeSettings(raw: unknown): Settings {
  if (!raw || typeof raw !== "object") return DEFAULT_SETTINGS;
  const r = raw as Record<string, unknown>;
  const percents: Record<string, number> = {};
  if (r.percents && typeof r.percents === "object") {
    for (const [k, v] of Object.entries(r.percents)) if (typeof v === "number" && Number.isFinite(v)) percents[k] = v;
  }
  return {
    count: typeof r.count === "number" && Number.isFinite(r.count) ? Math.max(1, Math.floor(r.count)) : DEFAULT_SETTINGS.count,
    mode: r.mode === "exam" ? "exam" : "practice",
    mix: r.mix === "custom" ? "custom" : "even",
    percents,
    timeMode: r.timeMode === "custom" ? "custom" : "auto",
    minutes: typeof r.minutes === "number" && Number.isFinite(r.minutes) ? clamp(Math.floor(r.minutes), 1, MAX_MINUTES) : DEFAULT_SETTINGS.minutes,
  };
}

export function sanitizePlan(raw: unknown, courses: readonly CourseInfo[]): QuizPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const selection = sanitize(r.selection, courses);
  const ids = Object.keys(selection);
  if (ids.length === 0 || typeof r.id !== "string" || !r.id || typeof r.count !== "number" || !Number.isInteger(r.count) || r.count < 1) return null;
  const w = r.weights && typeof r.weights === "object" ? (r.weights as Record<string, unknown>) : {};
  const weights: Record<string, number> = {};
  for (const id of ids) weights[id] = typeof w[id] === "number" && Number.isFinite(w[id]) ? (w[id] as number) : 0;
  return {
    id: r.id,
    selection,
    count: r.count,
    mode: r.mode === "exam" ? "exam" : "practice",
    weights,
    minutes: typeof r.minutes === "number" && Number.isFinite(r.minutes) ? r.minutes : 0,
  };
}
