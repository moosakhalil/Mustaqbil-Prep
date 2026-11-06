import { SECTIONS, type SectionId } from "./military";

/** Army initial test: a candidate who takes all three parts (Verbal, Non-verbal, Academic) needs at least this percent in EACH part
 *  to go on to the next round. Exactly 50% passes. A high score in one part does not make up for a low one. */
export const PASS_MARK = 50;

export type PartResult = {
  section: SectionId;
  /** Null when this part was not taken. */
  percent: number | null;
  pass: boolean | null;
  /** Points below the pass mark (0 when passed or not taken). */
  shortBy: number;
};

export type MockEvaluation = {
  parts: PartResult[];
  /** True only when all three parts were taken and each is at or above the pass mark. */
  eligible: boolean;
  failed: SectionId[];
  missing: SectionId[];
};

export const passes = (percent: number) => percent >= PASS_MARK;

export function evaluateMock(scores: Partial<Record<SectionId, number | null>>): MockEvaluation {
  const parts: PartResult[] = SECTIONS.map(({ id }) => {
    const percent = scores[id] ?? null;
    if (percent === null) return { section: id, percent: null, pass: null, shortBy: 0 };
    const pass = passes(percent);
    return { section: id, percent, pass, shortBy: pass ? 0 : Math.round((PASS_MARK - percent) * 10) / 10 };
  });
  const failed = parts.filter((p) => p.pass === false).map((p) => p.section);
  const missing = parts.filter((p) => p.percent === null).map((p) => p.section);
  return { parts, eligible: failed.length === 0 && missing.length === 0, failed, missing };
}

/** Readiness for a course: the average of the latest score in each part that has one. Null when there is no score yet. */
export function readiness(latest: Partial<Record<SectionId, number | null>>): number | null {
  const values = SECTIONS.map(({ id }) => latest[id]).filter((v): v is number => typeof v === "number");
  return values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : null;
}
