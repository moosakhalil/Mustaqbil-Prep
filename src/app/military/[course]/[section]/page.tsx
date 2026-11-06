import { notFound } from "next/navigation";
import { SectionStart } from "@/components/military/section-start";
import { SECTIONS, isMilitaryCourse } from "@/lib/military";
import { getPattern, getSubjects } from "@/lib/server/military";

export const metadata = { title: "Military · Mustaqbil Prep" };

export default async function SectionPage({ params }: { params: Promise<{ course: string; section: string }> }) {
  const { course, section } = await params;
  const meta = SECTIONS.find((s) => s.id === section);
  if (!isMilitaryCourse(course) || !meta) notFound();
  const [subjects, pattern] = await Promise.all([getSubjects(course), getPattern(course)]);
  return <SectionStart course={course} section={meta.id} subjects={subjects} pattern={pattern} />;
}
