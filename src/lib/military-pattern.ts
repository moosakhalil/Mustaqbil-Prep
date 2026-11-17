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

/**
 * Starting test pattern of PMA Long Course, used until the owner saves one in Military setup. It is what most Pakistani prep
 * websites describe (checked 17 Nov 2026), NOT an official army notice (the official site could not be reached): Verbal 84 MCQs
 * in 30 minutes, Non-verbal 64, Academic 50, pass mark 50% in each part, no negative marking. Sites differ on the Non-verbal and
 * Academic times (25 or 30 minutes): Non-verbal uses 30 (most sites), Academic 25 (sites split, so the stricter one).
 * Students see it as the official pattern; Military setup tells the owner it is unverified.
 */
export const PMA_LC_PATTERN: Pattern = { verbalCount: 84, verbalMinutes: 30, nonverbalCount: 64, nonverbalMinutes: 30, academicCount: 50, academicMinutes: 25 };

/** The built-in starting pattern of a course (PMA LC only), or none. */
export const defaultPattern = (course: string): Pattern => (course === "pma-lc" ? PMA_LC_PATTERN : NO_PATTERN);
