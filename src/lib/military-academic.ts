import { manifest } from "./manifest";
import { bankById, subjectCount, type SubjectRow } from "./military-data";
import { suggestionsFor } from "./military-suggest";

// Where the questions of an Academic part can come from. The first two work out of the box (no setup by the owner);
// the third is the owner's own list of subjects for the course, if he has added any.

export type AcademicSourceId = "past" | "important" | "course";
export type AcademicSource = { id: AcademicSourceId; title: string; text: string; subjects: SubjectRow[]; total: number };

const PAST_PAPER_BANKS: { bank: string; title: string }[] = [
  { bank: "pp-networks", title: "Networks" },
  { bank: "pp-subnetting", title: "Subnetting" },
  { bank: "pp-security", title: "Security" },
  { bank: "pp-programming-web", title: "Programming and Web" },
  { bank: "pp-databases", title: "Databases" },
  { bank: "pp-os-linux", title: "OS and Linux" },
  { bank: "pp-data-structures", title: "Data Structures" },
  { bank: "pp-software-engineering", title: "Software Engineering" },
  { bank: "pp-cloud-ai", title: "Cloud and AI" },
  { bank: "pp-computer-basics", title: "Computer Basics (past papers)" },
];

// LCC's real syllabus is not known yet, so its "important" set is a short starter list.
const LCC_IMPORTANT = ["cn", "cp", "is", "dbms"];

function militarySubject(course: string, bank: string, title: string, position: number): SubjectRow | null {
  const file = `academic-${course}-${bank}`;
  if (!bankById(file)) return null;
  return { id: `virt:${file}`, course, title, position, source: "military", degreeCourse: null, units: null, militaryFile: file };
}

function degreeSubject(course: string, degree: string, position: number): SubjectRow | null {
  const c = manifest.courses.find((x) => x.id === degree);
  if (!c) return null;
  return { id: `virt:deg:${degree}`, course, title: c.title, position, source: "degree", degreeCourse: degree, units: null, militaryFile: null };
}

const total = (list: SubjectRow[]) => list.reduce((t, s) => t + subjectCount(s), 0);

/** The sources a candidate can pick for the Academic part of one course. Sources with no questions are left out. */
export function academicSources(course: string, owner: SubjectRow[]): AcademicSource[] {
  const past = PAST_PAPER_BANKS.map((p, i) => militarySubject(course, p.bank, p.title, i)).filter((s): s is SubjectRow => !!s);

  const degreeIds = course === "lcc" ? LCC_IMPORTANT : suggestionsFor(course).important;
  const important = [
    militarySubject(course, "computer-basics", "Computer Basics", 0),
    ...degreeIds.map((id, i) => degreeSubject(course, id, i + 1)),
    ...(course === "navy-it" || course === "airforce-it" ? [militarySubject(course, "calculus", "Calculus (practice)", 90), militarySubject(course, "probability", "Probability (practice)", 91)] : []),
  ].filter((s): s is SubjectRow => !!s);

  const list: AcademicSource[] = [
    { id: "past", title: "Past papers", text: "Questions from earlier initial tests, by topic", subjects: past, total: total(past) },
    { id: "important", title: "Important subjects", text: "The topics that matter most for the test, with Computer Basics", subjects: important, total: total(important) },
  ];
  if (owner.length > 0) list.push({ id: "course", title: "Course subjects", text: "The subjects set for this course", subjects: owner, total: total(owner) });
  return list.filter((s) => s.total > 0);
}
