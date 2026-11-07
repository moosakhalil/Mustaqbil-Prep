import Link from "next/link";
import { Star } from "lucide-react";
import { IMPORTANT_TOPICS } from "@/lib/important-topics";

/** "Most repeated in past papers": the topics that matter most, with their share of an Academic part. No AI. */
export function ImportantTopics({ course }: { course: string }) {
  const top = IMPORTANT_TOPICS.slice(0, 6);
  const max = top[0]?.share ?? 1;
  return (
    <section className="rounded-card border border-line bg-surface p-4" aria-label="Most repeated in past papers">
      <h2 className="flex items-center gap-2 font-extrabold"><Star size={16} fill="currentColor" className="text-gold" aria-hidden /> Most repeated in past papers</h2>
      <p className="text-xs text-soft">Where most Academic questions come from (an estimate). Start with the top ones.</p>
      <ul className="mt-3 space-y-3">
        {top.map((t) => (
          <li key={t.id}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-bold">{t.title}</span>
              <span className="text-note tabular-nums text-soft">about {t.share}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
              <div className="h-full rounded-full bg-gold" style={{ width: `${(t.share / max) * 100}%` }} />
            </div>
            <p className="mt-1 text-xs text-soft">{t.covers}</p>
          </li>
        ))}
      </ul>
      <Link href={`/military/${course}/academic`} className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-military">
        Practise Academic
      </Link>
    </section>
  );
}
