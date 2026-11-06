import { notFound } from "next/navigation";
import { CourseHome } from "@/components/military/course-home";
import { isMilitaryCourse, militaryTitle } from "@/lib/military";
import { getPreferredCourse } from "@/lib/server/progress";
import { getSession, isAdmin } from "@/lib/session";

export async function generateMetadata({ params }: { params: Promise<{ course: string }> }) {
  const { course } = await params;
  return { title: `${isMilitaryCourse(course) ? militaryTitle(course) : "Military"} · Mustaqbil Prep` };
}

export default async function MilitaryCoursePage({ params }: { params: Promise<{ course: string }> }) {
  const { course } = await params;
  if (!isMilitaryCourse(course)) notFound();
  const session = await getSession();
  const user = session?.user;
  const preferred = user ? (await getPreferredCourse(user.id)) === course : false;
  return <CourseHome course={course} userId={user?.id ?? null} preferred={preferred} isOwner={!!user && isAdmin(user)} />;
}
