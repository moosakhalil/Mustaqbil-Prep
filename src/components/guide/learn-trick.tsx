import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { lessonHref, lessonsForQuestion } from "@/lib/guide";

/**
 * A small "Learn this trick" link to the lesson behind a question (its bank id and chapter, as a quiz holds them).
 * Shows nothing when no lesson covers the question.
 */
export function LearnTrickLink({ course, unit, back, className = "" }: { course: string; unit: number; back: string; className?: string }) {
  const lesson = lessonsForQuestion(course, unit)[0];
  if (!lesson) return null;
  return (
    <Link
      href={lessonHref(lesson, back)}
      aria-label={`Learn this trick: ${lesson.title}`}
      className={`flex min-h-12 items-center gap-1.5 rounded-full border border-gold bg-gold/20 px-4 text-[15px] font-bold ${className}`}
    >
      <Lightbulb size={18} aria-hidden /> Learn this trick
    </Link>
  );
}
