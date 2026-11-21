"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { useGuideRead } from "@/lib/guide/read";

export type ListItem = {
  key: string;
  href: string;
  title: string;
  summary: string;
  minutes: number;
  /** Questions the lesson is about. */
  count: number;
  /** What the count counts: "past questions" for past-paper banks, "questions" for the rest. */
  noun: string;
  /** Where the questions came from (Non-verbal only), shown in small text under the summary. */
  source?: string;
};

export type ListSectionView = { heading: string; items: ListItem[] };

/**
 * The lessons of one group under plain headings ("Must learn", "Then"), so a row needs no tags.
 * A row has a title and one line under it; on the right it shows "Read" with a tick, the "Next up" chip on the first lesson not yet read, or an arrow.
 * `summary` rows (Non-verbal) show what the lesson is about instead of the count.
 */
export function LessonList({ sections, summary = false }: { sections: ListSectionView[]; summary?: boolean }) {
  const read = useGuideRead();
  const all = sections.flatMap((s) => s.items);
  const nextKey = all.find((i) => !read.has(i.key))?.key;
  let place = 0;

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <section key={section.heading} aria-label={section.heading}>
          <h2 className="text-xl font-extrabold leading-tight">{section.heading}</h2>
          <ul className="mt-3 space-y-2.5">
            {section.items.map((item) => {
              place++;
              const done = read.has(item.key);
              const isNext = item.key === nextKey;
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className={`flex min-h-18 items-center gap-3 rounded-card bg-surface px-3.5 py-2.5 ${isNext ? "border-2 border-accent" : "border border-line"}`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-extrabold ${done ? "bg-ok text-bg" : "bg-accent/15 text-accent"}`}>
                      {done ? <Check size={20} strokeWidth={3} aria-label="Read" /> : place}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[17px] font-bold leading-snug">{item.title}</span>
                      <span className="block text-[15px] leading-snug text-soft">
                        {summary ? item.summary : `${item.count} ${item.noun} · ${item.minutes} min`}
                      </span>
                      {summary && item.source && <span className="mt-0.5 block text-sm text-soft">{item.count} {item.noun} · {item.minutes} min · {item.source}</span>}
                    </span>
                    {done ? (
                      <span className="shrink-0 text-sm font-bold text-ok">Read</span>
                    ) : isNext ? (
                      <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-0.5 text-sm font-bold text-accent">Next up</span>
                    ) : (
                      <ChevronRight size={20} className="shrink-0 text-soft" aria-hidden />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
