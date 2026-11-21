"use client";

import Link from "next/link";
import { BookOpen, Calculator, ChevronRight, LayoutGrid } from "lucide-react";
import { lessonHref, nextUnreadLesson, GROUPS, type GuideGroupId } from "@/lib/guide";
import { useGuideRead } from "@/lib/guide/read";
import { ReadProgress } from "./read-progress";

const ICONS = { verbal: Calculator, nonverbal: LayoutGrid, ssc: BookOpen, pma: BookOpen } as const;

/**
 * A card on the Study guide home: one part of the guide with its title (20px), one line about it (15px) and how many lessons are read.
 * `mine` adds the "Your course" chip. Academic parts use the olive colour, the rest use the app's blue.
 */
export function GroupCard({ group, href, keys, mine = false }: { group: GuideGroupId; href: string; keys: readonly string[]; mine?: boolean }) {
  const Icon = ICONS[group];
  const academic = group === "ssc" || group === "pma";
  const { title, hint } = GROUPS[group];
  const shortTitle = group === "ssc" ? "SSC" : group === "pma" ? "PMA Long Course" : title;
  return (
    <Link href={href} className="block rounded-card border border-line bg-surface p-4">
      <span className="flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-option ${academic ? "bg-military/15 text-military" : "bg-accent/15 text-accent"}`}>
          <Icon size={22} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-xl font-extrabold leading-tight">{shortTitle}</span>
            {mine && <span className="rounded-full bg-military/15 px-2.5 py-0.5 text-sm font-bold text-military">Your course</span>}
          </span>
          <span className="block text-[15px] text-soft">{group === "pma" ? "Most repeated set and 5 subjects" : hint}</span>
        </span>
        <ChevronRight size={20} className="shrink-0 text-soft" aria-hidden />
      </span>
      <ReadProgress keys={keys} className="mt-3" />
    </Link>
  );
}

/**
 * "Your next lesson": opens the first lesson not yet read (Verbal, then Non-verbal, then the student's own Academic part).
 * It says "Start here" until the student has read one. Shows nothing once every lesson is read.
 */
export function NextLessonCard({ preferred }: { preferred: string | null }) {
  const read = useGuideRead();
  const lesson = nextUnreadLesson(read, preferred);
  if (!lesson) return null;
  return (
    <Link href={lessonHref(lesson)} aria-label={`${read.size > 0 ? "Your next lesson" : "Start here"}: ${lesson.title}`} className="flex items-center gap-3 rounded-card border-2 border-accent bg-surface p-4">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-accent">{read.size > 0 ? "Your next lesson" : "Start here"}</span>
        <span className="block text-lg font-extrabold leading-snug">{lesson.title}</span>
        <span className="block text-[15px] text-soft">{lesson.group === "verbal" ? "Verbal" : lesson.group === "nonverbal" ? "Non-verbal" : lesson.group === "pma" ? "Academic · PMA" : "Academic · SSC"} · {lesson.minutes} min</span>
      </span>
      <ChevronRight size={24} className="shrink-0 text-accent" aria-hidden />
    </Link>
  );
}
