import { MilitaryPractice } from "@/components/military/military-practice";
import { MILITARY_COURSES, isMilitaryCourse } from "@/lib/military";
import { getPattern, getSubjects } from "@/lib/server/military";
import { getPreferredCourse } from "@/lib/server/progress";
import { getSession } from "@/lib/session";

export const metadata = { title: "Military practice · Mustaqbil Prep" };

/** Practice, Military side: the same pick-topics-then-size flow as Academia, for one military course (opens on the preferred one). */
export default async function MilitaryPracticePage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const { course: asked } = await searchParams;
  const session = await getSession();
  const preferred = session ? await getPreferredCourse(session.user.id) : null;
  const course = isMilitaryCourse(asked) ? asked : isMilitaryCourse(preferred) ? preferred : MILITARY_COURSES[0].id;
  const [subjects, pattern] = await Promise.all([getSubjects(course), getPattern(course)]);
  // key on the course so ticks do not carry over to another course
  return <MilitaryPractice key={course} course={course} subjects={subjects} pattern={pattern} />;
}
