import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, TriangleAlert, X } from "lucide-react";
import { AiFocusCard } from "@/components/home/ai-focus";
import { Hero, type Tone } from "@/components/home/picture-card";
import { ImportantTopics } from "@/components/military/important-topics";
import { PreferredButton } from "@/components/military/preferred-button";
import { MILITARY_COURSES, SECTIONS, type SectionId } from "@/lib/military";
import { academicSources } from "@/lib/military-academic";
import { intelligenceBank, subjectCount } from "@/lib/military-data";
import { isPatternSet } from "@/lib/military-pattern";
import { PASS_MARK, passes, readiness } from "@/lib/military-rules";
import { daysLeft } from "@/lib/ai-focus";
import { getPattern, getSectionScores, getSubjects } from "@/lib/server/military";
import { getProfileInfo } from "@/lib/server/progress";
import { pkDay } from "@/lib/streak";

const card = "flex items-center gap-3 rounded-card border border-line bg-surface p-3";

function ScoreChip({ percent }: { percent: number | null }) {
  if (percent === null) return <span className="shrink-0 rounded-full bg-line px-2.5 py-1 text-note font-bold text-soft">Not taken</span>;
  const ok = passes(percent);
  return (
    <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-note font-extrabold ${ok ? "bg-ok text-bg" : "bg-bad text-bg"}`}>
      {ok ? <Check size={14} aria-hidden /> : <X size={14} aria-hidden />}
      {percent}% · {ok ? "Pass" : `Below ${PASS_MARK}%`}
    </span>
  );
}

function StepNumber({ n }: { n: number }) {
  return <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-military font-extrabold text-bg">{n}</span>;
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
  const passedCount = scores ? SECTIONS.filter((s) => { const v = scores[s.id]; return v !== null && v !== undefined && passes(v); }).length : 0;
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

      <div className="mt-5 space-y-4">
        <section className="rounded-card border border-line bg-surface p-4" aria-label="Readiness">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm text-soft">Readiness</h2>
            <p className="text-lg font-extrabold tabular-nums text-military">{ready === null ? "–" : `${ready}%`}</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" role="img" aria-label={ready === null ? "No readiness score yet" : `Readiness ${ready}%`}>
            <div className="h-full rounded-full bg-military" style={{ width: `${ready ?? 0}%` }} />
          </div>
          <p className="mt-2 text-note text-soft">
            {ready === null ? (userId ? "Take a part to see your readiness." : "Sign in to track your readiness.") : `${passedCount} of 3 parts at ${PASS_MARK}% or more.`}
          </p>
          {userId && (
            <p className="text-note font-bold">
              {left !== null ? <Link href="/profile" className="inline-flex min-h-11 items-center text-gold">{left} {left === 1 ? "day" : "days"} to your test</Link> : <Link href="/profile" className="inline-flex min-h-11 items-center text-accent">Set your test date</Link>}
            </p>
          )}
        </section>

        {!isPatternSet(pattern) && (
          <p role="note" className="flex items-start gap-3 rounded-card border border-warn bg-warn/10 p-3 text-note">
            <TriangleAlert size={20} className="mt-0.5 shrink-0 text-warn" aria-hidden />
            <span><b>Example numbers.</b> The real test pattern is not set yet, so question counts and times in the mock test are examples.</span>
          </p>
        )}

        <ol aria-label="Your three parts" className="space-y-2">
          {SECTIONS.map((s, i) => {
            const isAcademic = s.id === "academic";
            return (
              <li key={s.id}>
                <Link href={`/military/${course}/${s.id}`} className={card}>
                  <StepNumber n={i + 1} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{s.title}</span>
                    <span className="block text-note text-soft">
                      {isAcademic
                        ? sources.length > 0 ? "Choose your subjects" : "No Academic questions yet"
                        : counts[s.id] > 0 ? `${counts[s.id]} questions${s.id === "nonverbal" ? " · pictures" : ""}` : "No questions yet"}
                    </span>
                  </span>
                  <ScoreChip percent={scores?.[s.id] ?? null} />
                </Link>
              </li>
            );
          })}
        </ol>

        <section>
          <Link href={`/military/${course}/mock`} className="flex h-14 items-center justify-center gap-2 rounded-option bg-military text-lg font-extrabold text-bg">
            Full mock test <ChevronRight size={20} aria-hidden />
          </Link>
          <p className="mt-2 text-note text-soft">Pass: {PASS_MARK}% or more in each of the three parts.</p>
        </section>

        <AiFocusCard scope={course} signedIn={!!userId} />

        <ImportantTopics course={course} />

        {isOwner && (
          <Link href="/admin/military" className="inline-flex min-h-12 items-center text-sm font-bold text-accent">
            Owner: Military setup (subjects and test pattern)
          </Link>
        )}
      </div>
    </>
  );
}
