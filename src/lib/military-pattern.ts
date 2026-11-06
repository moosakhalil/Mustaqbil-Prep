import type { SectionId } from "./military";

/** Section counts and times of the real initial test, as set by the owner (zero means "not set yet"). */
export type Pattern = {
  verbalCount: number; verbalMinutes: number;
  nonverbalCount: number; nonverbalMinutes: number;
  academicCount: number; academicMinutes: number;
};

export const NO_PATTERN: Pattern = { verbalCount: 0, verbalMinutes: 0, nonverbalCount: 0, nonverbalMinutes: 0, academicCount: 0, academicMinutes: 0 };

/** Used only until the owner sets the real pattern. These numbers are examples, not the official test. */
export const EXAMPLE_COUNTS: Record<SectionId, number> = { verbal: 20, nonverbal: 20, academic: 40 };

export const isPatternSet = (p: Pattern) => Object.values(p).some((v) => v > 0);
