// Degree courses suggested for each military course's Academic subjects, until the official syllabus is supplied.
// This is a starting default: the owner edits the actual subjects in Military setup. IDs are degree course ids (see public/data/manifest.json).
// Order follows how often each topic appears in the past initial-test questions (Networks first).

const IT_CORE = ["cn", "cp", "oop", "is", "cald", "dbms", "os", "dsa", "ds", "web"];
const IT_ALSO = ["ise", "cc", "ai", "bda", "ml", "daa", "vp", "sc"];

export const SUGGESTED: Record<string, { important: string[]; also: string[] }> = {
  icto: { important: IT_CORE, also: IT_ALSO },
  "navy-it": { important: IT_CORE, also: IT_ALSO },
  "airforce-it": { important: IT_CORE, also: IT_ALSO },
  // LCC may need a different list. Empty until the owner says which courses matter.
  lcc: { important: [], also: [] },
};

export const suggestionsFor = (course: string) => SUGGESTED[course] ?? { important: [], also: [] };

/**
 * Share of an Academic test each degree course gets (percent-like weights), from the topics of the past questions:
 * Networks about 20, Programming about 15, Security, Databases and Computer basics about 12 each, then OS, DSA and Software
 * engineering about 8 each, Cloud and AI about 5. Courses not listed get DEFAULT_WEIGHT.
 */
export const DEGREE_WEIGHT: Record<string, number> = {
  cn: 20,
  cp: 6, oop: 6, vp: 3,
  is: 12,
  dbms: 12,
  cald: 12,
  os: 8,
  dsa: 5, daa: 3,
  ise: 3, agile: 1, sc: 1, sda: 1, sre: 1, sqe: 1,
  cc: 2, ai: 2, bda: 1, ml: 1,
  ds: 2, web: 2,
};
export const DEFAULT_WEIGHT = 2;
/** Weight of a converted military Academic file (the owner added it on purpose, so it counts like an average subject). */
export const MILITARY_FILE_WEIGHT = 8;
/** Computer basics (abbreviations, number systems, networking basics, Git) is about 12% of past questions. */
export const BASICS_FILE_WEIGHT = 12;
/** Share of the Academic mix for the past-paper banks (`academic-<course>-pp-<topic>`), following the topic weights of the past questions. */
const PAST_PAPER_WEIGHT: Record<string, number> = {
  calculus: 5, probability: 5, networks: 14, subnetting: 6, security: 12, databases: 12, "programming-web": 15, "os-linux": 8,
  "data-structures": 8, "software-engineering": 8, "cloud-ai": 5, "computer-basics": 6,
};
export function militaryFileWeight(fileId: string): number {
  const pp = /-pp-(.+)$/.exec(fileId)?.[1];
  if (pp && pp in PAST_PAPER_WEIGHT) return PAST_PAPER_WEIGHT[pp];
  return fileId.endsWith("-computer-basics") ? BASICS_FILE_WEIGHT : MILITARY_FILE_WEIGHT;
}

export const degreeWeight = (id: string) => DEGREE_WEIGHT[id] ?? DEFAULT_WEIGHT;

/** A subject the owner can add in one tap from "Quick setup": a converted military bank (file = `academic-<course>-<bank>`) and the name users see. */
export type RecommendedSubject = { bank: string; title: string };

const IT_RECOMMENDED: RecommendedSubject[] = [
  { bank: "pp-networks", title: "Imp · Networks" },
  { bank: "pp-subnetting", title: "Imp · Subnetting" },
  { bank: "pp-security", title: "Imp · Security" },
  { bank: "computer-basics", title: "Imp · Computer Basics" },
  { bank: "pp-programming-web", title: "Imp · Programming" },
  { bank: "pp-databases", title: "Imp · Databases" },
  { bank: "pp-os-linux", title: "OS and Linux" },
  { bank: "pp-data-structures", title: "Data Structures" },
  { bank: "pp-software-engineering", title: "Software Engineering" },
  { bank: "pp-cloud-ai", title: "Cloud and AI" },
  { bank: "pp-computer-basics", title: "Computer Basics (past papers)" },
];

/** Starter set per course, from the topics the past papers repeat most. LCC's real syllabus is not known yet, so it gets a short set. */
export const RECOMMENDED: Record<string, RecommendedSubject[]> = {
  icto: IT_RECOMMENDED,
  "navy-it": [...IT_RECOMMENDED, { bank: "calculus", title: "Calculus (practice)" }, { bank: "probability", title: "Probability (practice)" }],
  "airforce-it": [...IT_RECOMMENDED, { bank: "calculus", title: "Calculus (practice)" }, { bank: "probability", title: "Probability (practice)" }],
  lcc: [
    { bank: "computer-basics", title: "Imp · Computer Basics" },
    { bank: "pp-networks", title: "Imp · Networks" },
    { bank: "pp-security", title: "Imp · Security" },
    { bank: "pp-programming-web", title: "Imp · Programming" },
    { bank: "pp-computer-basics", title: "Computer Basics (past papers)" },
  ],
};
