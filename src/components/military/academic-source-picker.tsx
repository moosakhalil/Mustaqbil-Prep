"use client";

import { type AcademicSource, type AcademicSourceId } from "@/lib/military-academic";

/** "Which Academic questions do you want?": past papers, important subjects, or the course's own subjects. */
export function AcademicSourcePicker({ sources, value, onChange }: { sources: AcademicSource[]; value: AcademicSourceId; onChange: (id: AcademicSourceId) => void }) {
  return (
    <section aria-label="Academic questions from">
      <h2 className="text-lg font-extrabold">Which Academic questions?</h2>
      <div className="mt-3 space-y-2" role="radiogroup" aria-label="Academic questions from">
        {sources.map((s) => {
          const on = s.id === value;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(s.id)}
              className={`flex w-full items-center justify-between gap-3 rounded-card border-2 p-4 text-left ${on ? "border-military bg-military/10" : "border-line bg-surface"}`}
            >
              <span>
                <span className="block font-bold">{s.title}</span>
                <span className="block text-xs text-soft">{s.text}</span>
              </span>
              <span className="shrink-0 text-sm font-extrabold tabular-nums">{s.total}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
