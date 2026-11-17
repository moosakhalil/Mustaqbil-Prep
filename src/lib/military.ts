// The military courses, in the order the Military screen shows them. Same ids are stored in the profile and the military tables.
export const MILITARY_COURSES = [
  { id: "icto", title: "ICTO", full: "Information & Communication Technology Officer", group: "army", blurb: "Information & Communication Technology Officer" },
  { id: "pma-lc", title: "PMA LC", full: "Pakistan Military Academy Long Course", group: "army", blurb: "Pakistan Military Academy, Long Course" },
  { id: "lcc", title: "LCC", full: "Lady Cadet Course", group: "army", blurb: "Lady Cadet Course" },
  { id: "navy-it", title: "Navy IT", full: "Pakistan Navy IT", group: "ssc", blurb: "Pakistan Navy, IT branch" },
  { id: "airforce-it", title: "PAF IT", full: "Pakistan Air Force IT", group: "ssc", blurb: "Pakistan Air Force, IT branch" },
] as const;

/** How the Military screen groups the courses: the Army courses, and the Navy and PAF IT branches. */
export const MILITARY_GROUPS = [
  { id: "army", title: "Army" },
  { id: "ssc", title: "Navy & PAF" },
] as const;

export type MilitaryCourseId = (typeof MILITARY_COURSES)[number]["id"];

export const isMilitaryCourse = (id: unknown): id is MilitaryCourseId => MILITARY_COURSES.some((c) => c.id === id);

export const militaryTitle = (id: string) => MILITARY_COURSES.find((c) => c.id === id)?.title ?? id;

/** The three parts of the initial test. Non-verbal is shared by every course; Verbal is shared too unless a course has its own (PMA LC); Academic belongs to each course. */
export const SECTIONS = [
  { id: "verbal", title: "Verbal", group: "Intelligence" },
  { id: "nonverbal", title: "Non-verbal", group: "Intelligence" },
  { id: "academic", title: "Academic", group: "Academic" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

/** The name of a part for one course. PMA LC's Academic part is only its past questions, so it is called "Past Academic". */
export const sectionTitle = (course: string, id: SectionId): string =>
  course === "pma-lc" && id === "academic" ? "Past Academic" : SECTIONS.find((s) => s.id === id)?.title ?? id;
