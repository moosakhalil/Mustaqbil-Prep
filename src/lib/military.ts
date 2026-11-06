// The four short service commission courses. Same ids are stored in the profile and the military tables.
export const MILITARY_COURSES = [
  { id: "icto", title: "ICTO", full: "Information & Communication Technology Officer", group: "army", blurb: "Information & Communication Technology Officer" },
  { id: "lcc", title: "LCC", full: "Lady Cadet Course", group: "army", blurb: "Lady Cadet Course" },
  { id: "navy-it", title: "Navy IT", full: "Pakistan Navy IT", group: "ssc", blurb: "Pakistan Navy, IT branch" },
  { id: "airforce-it", title: "PAF IT", full: "Pakistan Air Force IT", group: "ssc", blurb: "Pakistan Air Force, IT branch" },
] as const;

/** How the Military screen groups the courses: the Army courses, and the Short Service Commission (SSC) IT branches. */
export const MILITARY_GROUPS = [
  { id: "army", title: "Army" },
  { id: "ssc", title: "Short Service Commission (SSC)" },
] as const;

export type MilitaryCourseId = (typeof MILITARY_COURSES)[number]["id"];

export const isMilitaryCourse = (id: unknown): id is MilitaryCourseId => MILITARY_COURSES.some((c) => c.id === id);

export const militaryTitle = (id: string) => MILITARY_COURSES.find((c) => c.id === id)?.title ?? id;

/** The three parts of the initial test. Verbal and Non-verbal are shared (Intelligence); Academic belongs to each course. */
export const SECTIONS = [
  { id: "verbal", title: "Verbal", group: "Intelligence" },
  { id: "nonverbal", title: "Non-verbal", group: "Intelligence" },
  { id: "academic", title: "Academic", group: "Academic" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];
