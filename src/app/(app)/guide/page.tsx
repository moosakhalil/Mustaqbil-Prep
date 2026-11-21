import Link from "next/link";
import { ChevronRight, Clock, GraduationCap, Lightbulb } from "lucide-react";
import { BackHeader } from "@/components/home/back-header";
import { GuideSoonRow } from "@/components/guide/guide-card";
import { GroupCard, NextLessonCard } from "@/components/guide/hub-cards";
import { SSC_COURSES, groupHref, lessonKey, lessonsOf, type GuideGroupId } from "@/lib/guide";
import { PASS_MARK } from "@/lib/military-rules";
import { getProfileInfo } from "@/lib/server/progress";
import { getSession } from "@/lib/session";

export const metadata = { title: "Study guide · Mustaqbil Prep" };

const keysOf = (group: GuideGroupId) => lessonsOf(group).map(lessonKey);
const heading = "text-xl font-extrabold leading-tight";

/** The Study guide: short lessons on what the past papers repeat most. Verbal and Non-verbal first, then Academic. */
export default async function GuidePage() {
  const session = await getSession();
  const preferred = session ? (await getProfileInfo(session.user.id)).preferredCourse : null;
  const mineSsc = SSC_COURSES.some((c) => c === preferred);
  const minePma = preferred === "pma-lc";

  return (
    <>
      <BackHeader title="Study guide" href="/home/military" label="Military" color="text-military" />

      <section className="mt-4 flex items-center gap-3 rounded-card bg-linear-to-br from-[#1a1a2e] via-[#3a3a7a] to-[#6a6fd0] p-3.5 text-white" aria-label="About the guide">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Lightbulb size={20} aria-hidden />
        </span>
        <div>
          <h2 className="text-[17px] font-extrabold leading-tight">Learn what repeats most</h2>
          <p className="text-sm text-white/90">Built from the past questions in this app. You need {PASS_MARK}% in Verbal, Non-verbal and Academic.</p>
        </div>
      </section>

      <div className="mt-4">
        <NextLessonCard preferred={preferred} />
      </div>

      <h2 className={`mt-6 ${heading}`}>Learn first</h2>
      <div className="mt-3 space-y-3">
        <GroupCard group="verbal" href={groupHref("verbal")} keys={keysOf("verbal")} />
        <GroupCard group="nonverbal" href={groupHref("nonverbal")} keys={keysOf("nonverbal")} />
      </div>

      <h2 className={`mt-6 ${heading}`}>Academic</h2>
      <p className="mt-1 text-[15px] text-soft">Only the topics the past papers repeat.</p>
      <div className="mt-3 space-y-3">
        <GroupCard group="ssc" href={groupHref("ssc")} keys={keysOf("ssc")} mine={mineSsc} />
        <GroupCard group="pma" href={groupHref("pma")} keys={keysOf("pma")} mine={minePma} />
      </div>

      <h2 className={`mt-6 ${heading}`}>More</h2>
      <div className="mt-3 space-y-3">
        <Link href="/guide/tips" className="flex min-h-18 items-center gap-3 rounded-card border border-line bg-surface p-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-option bg-accent/10 text-accent">
            <Clock size={18} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-bold leading-snug">Exam tips and pass plan</span>
            <span className="block text-[15px] leading-snug text-soft">What to do, step by step</span>
          </span>
          <ChevronRight size={20} className="shrink-0 text-soft" aria-hidden />
        </Link>
        <GuideSoonRow icon={GraduationCap} title="Degree topics" hint="Notes for the other subjects. Not ready yet." />
      </div>

      <p className="mt-5 flex items-start gap-3 rounded-card border border-gold/60 bg-gold/15 p-3.5 text-base">
        <Lightbulb size={22} className="mt-0.5 shrink-0" aria-hidden />
        <span><b>Stuck in a quiz?</b> Tap the bulb at the top of the question. It opens the trick for that question.</span>
      </p>
    </>
  );
}
