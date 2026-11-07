"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type SourceKind = "Degree" | "Military" | "AI";
export type SourceItem = { id: string; kind: SourceKind; title: string; short: string; text: string };

const FILTERS: ("All" | SourceKind)[] = ["All", "Degree", "Military", "AI"];

const kindStyle: Record<SourceKind, string> = {
  Degree: "bg-accent/15 text-accent",
  Military: "bg-military/15 text-military",
  AI: "bg-gold/20 text-text",
};

/** Filter chips and one collapsible card per source: the title and one line, and a tap opens the rest. */
export function SourcesList({ items }: { items: SourceItem[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const shown = items.filter((i) => filter === "All" || i.kind === filter);

  return (
    <>
      <div role="group" aria-label="Show sources" className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={f === filter}
            onClick={() => setFilter(f)}
            className={`h-11 rounded-full px-5 text-sm font-bold ${f === filter ? "bg-accent text-accent-ink" : "bg-line/60 text-soft"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {shown.map((r) => (
          <li key={r.id}>
            <details className="group rounded-card border border-line bg-surface">
              <summary className="flex min-h-14 cursor-pointer list-none items-start justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-note font-semibold ${kindStyle[r.kind]}`}>{r.kind}</span>
                    <span className="font-bold">{r.title}</span>
                  </span>
                  <span className="mt-1 block text-sm text-soft group-open:hidden">{r.short}</span>
                </span>
                <ChevronDown size={20} className="mt-0.5 shrink-0 text-soft transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="px-4 pb-4 text-sm text-soft">{r.text}</p>
            </details>
          </li>
        ))}
      </ul>
    </>
  );
}
