import { notFound } from "next/navigation";
import { MockStart } from "@/components/military/mock-start";
import { isMilitaryCourse } from "@/lib/military";
import { getPattern, getSubjects } from "@/lib/server/military";

export const metadata = { title: "Mock test · Mustaqbil Prep" };

export default async function MockPage({ params }: { params: Promise<{ course: string }> }) {
  const { course } = await params;
  if (!isMilitaryCourse(course)) notFound();
  const [subjects, pattern] = await Promise.all([getSubjects(course), getPattern(course)]);
  return <MockStart course={course} subjects={subjects} pattern={pattern} />;
}
