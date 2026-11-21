import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { BackHeader } from "@/components/home/back-header";
import { LessonAi } from "@/components/guide/lesson-ai";
import { LessonBar } from "@/components/guide/lesson-bar";
import { LessonBlocks } from "@/components/guide/lesson-blocks";
import { GROUPS, findLesson, groupHref, guideCourse, hasAiHelper, jumpLinks, lessonHref, lessonKey, lessonsOf, nextLesson, parseBack, pastCount, practiceCount, practiceFor } from "@/lib/guide";
import { getProfileInfo } from "@/lib/server/progress";
import { getSession } from "@/lib/session";

export async function generateMetadata({ params }: { params: Promise<{ group: string; id: string }> }) {
  const { group, id } = await params;
  return { title: `${findLesson(group, id)?.title ?? "Lesson"} · Mustaqbil Prep` };
}

const chip = "rounded-full px-3 py-1 text-sm font-bold";

/** One lesson: the trick, worked examples, what to watch out for, the AI helper, and a bar to mark it read or try a few questions. */
export default async function LessonPage({ params, searchParams }: { params: Promise<{ group: string; id: string }>; searchParams: Promise<{ back?: string }> }) {
  const { group, id } = await params;
  const lesson = findLesson(group, id);
  if (!lesson) notFound();
  // opened from inside a quiz or its review: the header and the bottom bar lead straight back there
  const back = parseBack((await searchParams).back);

  const session = await getSession();
  const preferred = session ? (await getProfileInfo(session.user.id)).preferredCourse : null;
  const course = guideCourse(lesson.group, preferred);
  const list = lessonsOf(lesson.group);
  const place = list.findIndex((l) => l.id === lesson.id);
  const next = nextLesson(lesson);
  const count = pastCount(lesson, course);
  const pinned = lesson.id === "most-repeated";
  // Non-verbal lessons are chapters, not a ranking
  const ranked = lesson.group !== "nonverbal" && !pinned;
  const rank = list.filter((l) => l.id !== "most-repeated").findIndex((l) => l.id === lesson.id) + 1;
  const noun = lesson.group === "nonverbal" ? "questions" : "past questions";
  const jumps = jumpLinks(lesson.blocks);

  return (
    <div className="pb-40">
      <BackHeader
        title={lesson.title}
        href={back ?? groupHref(lesson.group)}
        label={back ? (back === "/quiz" ? "Your quiz" : "Your review") : GROUPS[lesson.group].title}
        color="text-military"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {pinned && <span className={`${chip} bg-gold/25`}>Start here</span>}
        {ranked && <span className={`${chip} bg-gold/25`}>No. {rank}{count > 0 ? ` · ${count} ${noun}` : ""}</span>}
        {!ranked && count > 0 && <span className={`${chip} border border-line bg-surface text-soft`}>{count} {noun}</span>}
        <span className={`${chip} border border-line bg-surface text-soft`}>{lesson.minutes} min read</span>
      </div>

      {lesson.group === "nonverbal" && (
        <div className="mt-3" role="img" aria-label={`Chapter ${place + 1} of ${list.length}`}>
          <div className="flex gap-1">
            {list.map((l, i) => (
              <span key={l.id} className={`h-2 flex-1 rounded-full ${i === place ? "bg-accent" : "bg-line"}`} />
            ))}
          </div>
          <p className="mt-1.5 text-[15px] font-semibold text-soft">Chapter {place + 1} of {list.length}</p>
        </div>
      )}

      {jumps.length > 0 && (
        <nav aria-label="On this page" className="mt-4">
          <p className="text-sm font-bold text-soft">On this page</p>
          <ul className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1">
            {jumps.map((j) => (
              <li key={j.id} className="shrink-0">
                <a href={`#${j.id}`} className="flex min-h-11 items-center whitespace-nowrap rounded-full border border-line bg-surface px-4 text-[15px] font-bold">
                  {j.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="mt-4">
        <LessonBlocks blocks={lesson.blocks} />
      </div>

      {hasAiHelper(lesson) && (
        <div className="mt-4">
          <LessonAi lessonKey={lessonKey(lesson)} />
        </div>
      )}

      {next && (
        <Link href={lessonHref(next, back)} className="mt-4 flex min-h-18 items-center gap-3 rounded-card border border-line bg-surface px-4">
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-soft">Next lesson</span>
            <span className="block text-[17px] font-bold leading-snug">{next.title}</span>
          </span>
          <ChevronRight size={20} className="shrink-0 text-soft" aria-hidden />
        </Link>
      )}

      <LessonBar
        lessonKey={lessonKey(lesson)}
        title={lesson.title}
        course={course}
        source={practiceFor(lesson, course)}
        available={practiceCount(lesson, course)}
        noun={lesson.group === "nonverbal" ? "picture questions" : "questions"}
        back={back}
      />
    </div>
  );
}
