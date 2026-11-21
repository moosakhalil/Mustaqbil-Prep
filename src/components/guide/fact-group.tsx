"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { countMatching } from "@/lib/guide/facts";
import { splitBold } from "@/lib/guide/markup";
import type { FactGroup as Group } from "@/lib/guide/types";
import { bankById } from "@/lib/military-data";
import { loadCourse } from "@/lib/question-loader";

/** A count is shown only when it is a number a student can trust: small counts ("1 past question") read like a mistake. */
export const MIN_SHOWN_COUNT = 10;

/** The fact with its key words in bold. */
function Fact({ text }: { text: string }) {
  return (
    <li>
      {splitBold(text).map((p, i) => (p.bold ? <b key={i}>{p.text}</b> : <span key={i}>{p.text}</span>))}
    </li>
  );
}

/**
 * One group of short facts. It opens and closes (the first group of a lesson starts open) so the page is a few rows to scan, not one long wall.
 * When the group has a pattern and the lesson's bank has loaded, it also says how many past questions mention the group (only when that is 10 or more).
 */
export function FactGroup({ group, bank, open }: { group: Group; bank: string | undefined; open: boolean }) {
  const [count, setCount] = useState<number | null>(null);
  const code = bank ? bankById(bank)?.code : undefined;
  const match = group.match;

  useEffect(() => {
    if (!code || !match) return;
    let cancelled = false;
    loadCourse(code)
      .then((questions) => {
        if (!cancelled) setCount(countMatching(questions, match));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [code, match]);

  const facts = `${group.facts.length} ${group.facts.length === 1 ? "fact" : "facts"}`;
  const meta = count !== null && count >= MIN_SHOWN_COUNT ? `${count} past questions · ${facts}` : facts;

  return (
    <details open={open} className="group rounded-card border border-line bg-surface">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-2.5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-bold leading-snug">{group.title}</span>
          <span className="block text-sm text-soft">{meta}</span>
        </span>
        <ChevronRight size={20} className="shrink-0 text-soft transition-transform group-open:rotate-90" aria-hidden />
      </summary>
      <ul className="list-disc space-y-2 px-4 pb-4 pl-9 text-base leading-relaxed">
        {group.facts.map((f, i) => (
          <Fact key={i} text={f} />
        ))}
      </ul>
    </details>
  );
}
