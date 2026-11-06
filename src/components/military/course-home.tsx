import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AiFocusCard } from "@/components/home/ai-focus";
import { Hero, type Tone } from "@/components/home/picture-card";
import { ImportantTopics } from "@/components/military/important-topics";
import { PreferredButton } from "@/components/military/preferred-button";
import { MILITARY_COURSES, SECTIONS, militaryTitle, type SectionId } from "@/lib/military";
import { academicSources } from "@/lib/military-academic";
import { intelligenceBank, subjectCount } from "@/lib/military-data";
import { isPatternSet } from "@/lib/military-pattern";
import { PASS_MARK, passes, readiness } from "@/lib/military-rules";
import { daysLeft } from "@/lib/ai-focus";
import { getPattern, getSectionScores, getSubjects } from "@/lib/server/military";
import { getProfileInfo } from "@/lib/server/progress";
import { pkDay } from "@/lib/streak";

const card = "flex items-center justify-between gap-3 rounded-card border border-line bg-surface p-4";

function ScoreChip({ percent }: { percent: number | null }) {
  if (percent === null) return <span className="shrink-0 text-xs text-soft">Not taken yet</span>;
  const ok = passes(percent);
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ${ok ? "bg-ok text-bg" : "bg-bad text-bg"}`}>
      Last {percent}% · {ok ? "Pass" : "Below 50%"}
    </span>
  );
}

/** One course: hero picture, readiness, Intelligence (Verbal, Non-verbal), Academic and the full mock test. */
export async function CourseHome({ course, userId, preferred, isOwner }: { course: string; userId: string | null; preferred: boolean; isOwner: boolean }) {
  const info = MILITARY_COURSES.find((c) => c.id === course)!;
  const [subjects, pattern, scores, profileInfo] = await Promise.all([
    getSubjects(course), getPattern(course), userId ? getSectionScores(userId, course) : Promise.resolve(null), userId ? getProfileInfo(userId) : Promise.resolve(null),
  ]);
  const left = daysLeft(profileInfo?.examDate, pkDay(new Date()));
  const sources = academicSources(course, subjects);
  const ready = scores ? readiness(scores) : null;
  const academicTotal = subjects.reduce((t, s) => t + subjectCount(s), 0);
  const counts: Record<SectionId, number> = { verbal: intelligenceBank("verbal")?.total ?? 0, nonverbal: intelligenceBank("nonverbal")?.total ?? 0, academic: academicTotal };

  return (
    <>
      <Hero course={course} tone={course as Tone}>
        <Link href="/home/military" aria-label="Back to Military" className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white">
          <ChevronLeft size={22} aria-hidden />
        </Link>
        <span className="absolute right-4 top-4">
          <PreferredButton course={course} preferred={preferred} signedIn={!!userId} />
        </span>
        <span className="absolute inset-x-5 bottom-4">
          <span className="block text-[28px] font-extrabold leading-tight">{info.title}</span>
          <span className="block text-sm text-white/90">{info.group === "army" ? "Army" : "SSC"} · {info.full}</span>
        </span>
      </Hero>

      <div className="mt-5 space-y-5">
        <section className="rounded-card border border-line bg-surface p-4" aria-label="Readiness">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm text-soft">Readiness</h2>
            <p className="text-lg font-extrabold tabular-nums text-military">{ready === null ? "–" : `${ready}%`}</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" role="img" aria-label={ready === null ? "No readiness score yet" : `Readiness ${ready}%`}>
            <div className="h-full rounded-full bg-military" style={{ width: `${ready ?? 0}%` }} />
          </div>
          <p className="mt-2 text-xs text-soft">{ready === null ? (userId ? "Take a part to see your readiness." : "Sign in to track your readiness.") : "From your latest part scores."}</p>
          {userId && (
            <p className="mt-1 text-xs font-bold">
              {left !== null ? <Link href="/profile" className="text-gold">{left} {left === 1 ? "day" : "days"} to your test</Link> : <Link href="/profile" className="text-accent">Set your test date</Link>}
            </p>
          )}
        </section>

        <AiFocusCard scope={course} signedIn={!!userId} />

        <ImportantTopics course={course} />

        <section>
          <h2 className="font-extrabold">1  Intelligence</h2>
          <p className="text-xs text-soft">Same for all four courses.</p>
          <div className="mt-2 space-y-2">
            {SECTIONS.filter((s) => s.group === "Intelligence").map((s) => (
              <Link key={s.id} href={`/military/${course}/${s.id}`} className={card}>
                <span>
                  <span className="block font-bold">{s.title}</span>
                  <span className="text-xs text-soft">{counts[s.id] > 0 ? `${counts[s.id]} questions${s.id === "nonverbal" ? " · pictures" : ""}` : "No questions yet"}</span>
                </span>
                <ScoreChip percent={scores?.[s.id] ?? null} />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-extrabold">2  Academic</h2>
          <p className="text-xs text-soft">Subjects of {militaryTitle(course)}.</p>
          <Link href={`/military/${course}/academic`} className={`${card} mt-2`}>
            <span className="min-w-0">
              <span className="block font-bold">{sources.length > 0 ? "Choose your Academic questions" : "No Academic questions yet"}</span>
              <span className="block truncate text-xs text-soft">
                {sources.length > 0 ? sources.map((s) => `${s.title} ${s.total}`).join(" · ") : "Nothing has been added for this course."}
              </span>
            </span>
            <ScoreChip percent={scores?.academic ?? null} />
          </Link>
        </section>

        <section>
          <Link href={`/military/${course}/mock`} className="flex h-14 items-center justify-center gap-2 rounded-option bg-military text-lg font-extrabold text-bg">
            Full mock test <ChevronRight size={20} aria-hidden />
          </Link>
          <p className="mt-2 text-xs text-soft">
            Pass: {PASS_MARK}% or more in each of the three parts.
            {!isPatternSet(pattern) && " Section counts and times are examples until the real pattern is set."}
          </p>
        </section>

        {isOwner && (
          <Link href="/admin/military" className="inline-flex min-h-12 items-center text-sm font-bold text-accent">
            Owner: Military setup (subjects and test pattern)
          </Link>
        )}
      </div>
    </>
  );
}
