import raw from "../../public/data/military/manifest.json";
import { manifest } from "./manifest";
import type { MilitaryBank, MilitaryManifest } from "./question-types";

// Military question banks you converted (Verbal, Non-verbal, Academic subjects). Empty until the first build of scripts/build-military.mjs.
export const militaryManifest = raw as unknown as MilitaryManifest;

export const bankById = (id: string): MilitaryBank | undefined => militaryManifest.banks.find((b) => b.id === id);

/** Shared Intelligence banks. */
export const intelligenceBank = (section: "verbal" | "nonverbal"): MilitaryBank | undefined => militaryManifest.banks.find((b) => b.section === section);

/** Academic banks of one course (converted military material). */
export const academicBanks = (course: string): MilitaryBank[] => militaryManifest.banks.filter((b) => b.section === "academic" && b.course === course);

export type SubjectRow = {
  id: string;
  course: string;
  title: string;
  position: number;
  source: "degree" | "military";
  degreeCourse: string | null;
  units: number[] | null;
  militaryFile: string | null;
};

/** How many questions a subject gives, from the data in the app. 0 if its source is missing. */
export function subjectCount(s: Pick<SubjectRow, "source" | "degreeCourse" | "units" | "militaryFile">): number {
  if (s.source === "military") return bankById(s.militaryFile ?? "")?.total ?? 0;
  const c = manifest.courses.find((x) => x.id === s.degreeCourse);
  if (!c) return 0;
  const wanted = s.units ? new Set(s.units) : null;
  return c.units.filter((u) => !wanted || wanted.has(u.n)).reduce((t, u) => t + u.count, 0);
}
