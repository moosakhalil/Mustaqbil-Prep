import { notFound } from "next/navigation";
import { BackHeader } from "@/components/home/back-header";
import { GuideSoonRow } from "@/components/guide/guide-card";
import { LessonList, type ListSectionView } from "@/components/guide/lesson-list";
import { GROUPS, SSC_COURSES, guideCourse, isGroupId, lessonHref, lessonKey, lessonsOf, listSections, pastCount, type GuideGroupId } from "@/lib/guide";
import { bankById } from "@/lib/military-data";
import { militaryTitle } from "@/lib/military";
import { getProfileInfo } from "@/lib/server/progress";
import { getSession } from "@/lib/session";

export async function generateMetadata({ params }: { params: Promise<{ group: string }> }) {
  const { group } = await params;
  return { title: `${isGroupId(group) ? GROUPS[group].title : "Study guide"} · Mustaqbil Prep` };
}

/** What the bank's chapter title says about where its questions came from, as a short label (Non-verbal). None of these chapters is confirmed past-paper material. */
function sourceTag(title: string): string {
  if (/written by claude/i.test(title)) return "Made for this app";
  if (/practice book/i.test(title)) return "Practice book";
  return "Prep MCQs";
}

/** "Analogies and word relations (practice, written by Claude)" -> "Analogies and word relations". */
const plainTitle = (title: string) => title.replace(/\s*\(.*\)\s*$/, "");

const intro = "mt-3 text-base leading-relaxed text-soft";

/** One part of the guide (Verbal, Non-verbal, SSC or PMA): its lessons under plain headings, the biggest topic first. */
export default async function GuideGroupPage({ params }: { params: Promise<{ group: string }> }) {
  const { group } = await params;
  if (!isGroupId(group)) notFound();
  const id: GuideGroupId = group;
  const session = await getSession();
  const preferred = session ? (await getProfileInfo(session.user.id)).preferredCourse : null;
  const course = guideCourse(id, preferred);

  const nonverbalUnits = bankById("nonverbal")?.units ?? [];
  const nonverbalIds = lessonsOf("nonverbal").map((l) => l.id);
  const sections: ListSectionView[] = listSections(id).map((s) => ({
    heading: s.heading,
    items: s.lessons.map((l) => ({
      key: lessonKey(l),
      href: lessonHref(l),
      title: l.title,
      summary: l.summary,
      minutes: l.minutes,
      count: pastCount(l, course),
      noun: id === "nonverbal" ? "questions" : "past questions",
      source: id === "nonverbal" ? sourceTag(nonverbalUnits[nonverbalIds.indexOf(l.id)]?.title ?? "") : undefined,
    })),
  }));
  const total = id === "ssc" || id === "pma" ? sections.flatMap((s) => s.items).filter((i) => i.key !== "pma/most-repeated").reduce((t, i) => t + i.count, 0) : 0;
  const topics = sections.flatMap((s) => s.items).length;

  // Verbal: the practice chapters of the bank that are not "Past repeated"
  const otherVerbal = (bankById("verbal")?.units ?? []).filter((u) => !/past repeated/i.test(u.title));

  return (
    <>
      <BackHeader title={GROUPS[id].title} href="/guide" label="Study guide" color="text-military" />

      {id === "verbal" && <p className={intro}>Start at the top. These six came up most in the real papers.</p>}
      {id === "nonverbal" && <p className={intro}>One lesson for each chapter. None of them is confirmed past-paper material, so they are not ranked.</p>}
      {id === "ssc" && (
        <>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Courses">
            {SSC_COURSES.map((c) => (
              <li key={c} className="rounded-full bg-military/15 px-3 py-1 text-sm font-bold text-military">{militaryTitle(c)}</li>
            ))}
          </ul>
          <p className={intro}>{total} past questions in {topics} topics. All four courses repeat the same topics.</p>
        </>
      )}
      {id === "pma" && <p className={intro}>PMA Academic is its own past tests only. Start with the Most repeated set, then the subjects ({total} questions in all).</p>}

      <div className="mt-5">
        <LessonList sections={sections} summary={id === "nonverbal"} />
      </div>

      {id === "verbal" && otherVerbal.length > 0 && (
        <section className="mt-6" aria-label="More practice">
          <h2 className="text-xl font-extrabold leading-tight">More practice</h2>
          <div className="mt-3 rounded-card border border-line bg-surface p-4">
            <p className="text-[17px] font-bold">Other chapters</p>
            <p className="mt-1 text-[15px] leading-relaxed text-soft">
              {otherVerbal.map((u) => plainTitle(u.title)).join(", ")} · {otherVerbal.reduce((t, u) => t + u.count, 0)} questions. They are practice questions, and the lessons above cover them.
            </p>
          </div>
          <p className="mt-3 text-[15px] text-soft">Counts are the questions in the Verbal bank. The PMA Verbal file has the same six topics in a similar order.</p>
        </section>
      )}

      {id === "ssc" && <GuideSoonRow className="mt-6" title="Other degree topics" hint="Not asked again and again in the past papers." />}
    </>
  );
}
