import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { lessonHref, weakLessons } from "@/lib/guide";
import type { Score } from "@/lib/quiz/score";

/**
 * "Fix this first" on the result screen: the weakest topic that has a lesson, with a button to read it, and up to two more weak topics as small links.
 * Shows nothing when every topic with a lesson went well (70% or more) or no question had a lesson.
 */
export function FixFirst({ score }: { score: Pick<Score, "byUnit"> }) {
  const weak = weakLessons(score);
  if (weak.length === 0) return null;
  const [first, ...rest] = weak;
  return (
    <section aria-label="Fix this first" className="mt-6">
      <h2 className="text-xl font-extrabold leading-tight">Fix this first</h2>
      <div className="mt-3 rounded-card border-2 border-gold bg-gold/15 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-option border border-gold bg-surface">
            <Lightbulb size={22} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-extrabold leading-tight">{first.lesson.title}</p>
            <p className="text-[15px]">{first.correct} of {first.total} right</p>
          </div>
          <p className="shrink-0 text-lg font-extrabold tabular-nums">{first.percent}%</p>
        </div>
        <Link href={lessonHref(first.lesson)} className="mt-3 flex h-13 items-center justify-center gap-2 rounded-option bg-accent text-base font-bold text-accent-ink">
          <Lightbulb size={18} aria-hidden /> Learn this trick · {first.lesson.minutes} min
        </Link>
      </div>
      {rest.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="More topics to fix">
          {rest.slice(0, 2).map((w) => (
            <li key={`${w.lesson.group}/${w.lesson.id}`}>
              <Link href={lessonHref(w.lesson)} className="flex min-h-12 items-center gap-1.5 rounded-full border border-gold bg-gold/20 px-4 text-[15px] font-bold">
                <Lightbulb size={15} aria-hidden /> {w.lesson.title} · {w.percent}%
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
