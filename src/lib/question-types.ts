// Shape of the generated data in public/data (built by scripts/build-data.mjs from the question banks).

export type Question = {
  /** Stable id: course code + the bank's own id, e.g. "dsa-12". Never reused. */
  id: string;
  /** Unit (chapter) number inside the course. See CourseInfo.units. */
  u: number;
  q: string;
  /** Always exactly 4 options. */
  o: string[];
  /** 0-based index of the correct option in `o`. After shuffling, follow the option text, not the position. */
  a: number;
  /** Written explanation from the bank. */
  e: string;
  /** Indexes (into `o`) of options such as "None of these" that must stay last when options are shuffled. */
  p?: number[];
  /** Image of the question figure, e.g. "/data/military/img/nonverbal-12.webp" (non-verbal questions). */
  img?: string;
  /** Option images, in numbered order (they are never shuffled). `o` then holds the labels "1", "2", "3", "4". */
  oimg?: string[];
};

export type CourseData = { course: string; questions: Question[] };

export type UnitInfo = { n: number; title: string; count: number };

export type CourseInfo = {
  /** Short code, also the prefix of question ids. */
  id: string;
  title: string;
  domain: "degree";
  /** Path under /data/. */
  file: string;
  total: number;
  units: UnitInfo[];
  bytes: number;
};

export type Manifest = {
  /** Changes whenever any question changes; the offline cache uses it to know when to refresh. */
  version: string;
  totals: { courses: number; questions: number };
  courses: CourseInfo[];
  /** Groups of question ids that have the same text. A quiz must not include more than one id from a group. */
  duplicates: string[][];
};

/** One bank of military questions (Verbal, Non-verbal, or the Academic questions of one course), built by scripts/build-military.mjs. */
export type MilitaryBank = {
  /** File name without .json, e.g. "verbal", "nonverbal", "academic-icto-networks". */
  id: string;
  /** Prefix of question ids: "mil-" + id. */
  code: string;
  title: string;
  section: "verbal" | "nonverbal" | "academic";
  /** Academic banks belong to one course; Intelligence banks (verbal, nonverbal) are shared by all four, so this is absent. */
  course?: string;
  total: number;
  units: UnitInfo[];
  file: string;
  bytes: number;
};

export type MilitaryManifest = { version: string; banks: MilitaryBank[] };
