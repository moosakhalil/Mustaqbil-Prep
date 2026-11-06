"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, ListChecks, Search } from "lucide-react";
import { manifest } from "@/lib/manifest";
import type { CourseInfo } from "@/lib/question-types";
import { useSelection, setSelection, getSelection } from "@/lib/quiz/selection";
import { courseState, selectMany, summarize, toggleCourse, toggleUnit, type CheckState } from "@/lib/quiz/selection-logic";

const nf = new Intl.NumberFormat("en");

/** Native checkbox with the "some chapters ticked" mark. The whole row is the label, so the touch target is large. */
function Box({ state, label, onChange }: { state: CheckState; label: string; onChange: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === "some";
  }, [state]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={state === "all"}
      onChange={onChange}
      aria-label={label}
      aria-checked={state === "some" ? "mixed" : state === "all"}
      className="h-5 w-5 shrink-0 cursor-pointer accent-accent"
    />
  );
}

export function CoursePicker() {
  const selection = useSelection();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());

  const q = query.trim().toLowerCase();

  // With a search, a course shows when its name matches (all its chapters) or when some chapters match (only those)
  const visible = useMemo(() => {
    return manifest.courses
      .map((course) => {
        const nameHit = !q || course.title.toLowerCase().includes(q);
        const units = nameHit ? course.units : course.units.filter((u) => u.title.toLowerCase().includes(q));
        return { course, units };
      })
      .filter((v) => v.units.length > 0);
  }, [q]);

  const summary = summarize(selection, manifest.courses);
  const none = summary.chapters === 0;

  const toggleOpen = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <>
      <h1 className="text-center text-lg font-bold">Build your quiz</h1>

      <label className="mt-5 flex h-12 items-center gap-3 rounded-card border border-line bg-surface px-4 focus-within:border-accent">
        <Search size={18} className="text-soft" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a course or chapter"
          aria-label="Search a course or chapter"
          className="w-full bg-transparent outline-none placeholder:text-soft"
        />
      </label>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          <span className="rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent">Academia</span>
          <Link href="/practice/military" className="rounded-full bg-military/15 px-3 py-1.5 text-xs font-semibold text-military">
            Military
          </Link>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-accent">
          <button
            type="button"
            onClick={() =>
              setSelection(selectMany(getSelection(), visible.map((v) => ({ id: v.course.id, units: v.units.map((u) => u.n) }))))
            }
            className="min-h-12 px-1"
          >
            Select all
          </button>
          <span aria-hidden>·</span>
          <button type="button" onClick={() => setSelection({})} className="min-h-12 px-1">
            Clear
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 text-center text-soft">No course or chapter matches “{query}”.</p>
      ) : (
        <ul className="mt-1 overflow-hidden rounded-card border border-line bg-surface">
          {visible.map(({ course, units }) => (
            <CourseRow
              key={course.id}
              course={course}
              units={units}
              expanded={!!q || open.has(course.id)}
              onToggleOpen={() => toggleOpen(course.id)}
            />
          ))}
        </ul>
      )}

      {/* Sticky bar: always shows the running total and the Next button, above the bottom navigation */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20">
        <div className="mx-auto max-w-md rounded-t-sheet border border-b-0 border-line bg-surface px-5 pb-4 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold">
              {summary.courses} {summary.courses === 1 ? "course" : "courses"} · {summary.chapters}{" "}
              {summary.chapters === 1 ? "chapter" : "chapters"}
            </p>
            <p className="flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent">
              <ListChecks size={14} aria-hidden />
              {nf.format(summary.questions)} questions
            </p>
          </div>
          {none ? (
            <button
              type="button"
              disabled
              className="mt-3 flex h-12 w-full items-center justify-center rounded-option bg-line font-bold text-soft"
            >
              Pick at least one topic
            </button>
          ) : (
            <Link
              href="/practice/settings"
              className="mt-3 flex h-12 w-full items-center justify-center gap-1 rounded-option bg-accent font-bold text-accent-ink"
            >
              Next: set quiz size <ChevronRight size={18} aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

function CourseRow({
  course,
  units,
  expanded,
  onToggleOpen,
}: {
  course: CourseInfo;
  units: CourseInfo["units"];
  expanded: boolean;
  onToggleOpen: () => void;
}) {
  const selection = useSelection();
  const state = courseState(selection, course);
  const picked = new Set(selection[course.id] ?? []);

  return (
    <li className="border-b border-line last:border-b-0">
      <div className="flex items-center">
        <button
          type="button"
          onClick={onToggleOpen}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Hide" : "Show"} chapters of ${course.title}`}
          className="flex h-12 w-11 shrink-0 items-center justify-center text-soft"
        >
          {expanded ? <ChevronDown size={18} aria-hidden /> : <ChevronRight size={18} aria-hidden />}
        </button>
        <label className="flex min-h-12 flex-1 cursor-pointer items-center gap-3 pr-4 font-bold">
          <Box state={state} label={course.title} onChange={() => setSelection(toggleCourse(getSelection(), course))} />
          <span className="flex-1">{course.title}</span>
          <span className="text-xs font-semibold tabular-nums text-soft">{nf.format(course.total)}</span>
        </label>
      </div>

      {expanded && (
        <ul>
          {units.map((u) => (
            <li key={u.n} className="border-t border-line">
              <label className="flex min-h-12 cursor-pointer items-center gap-3 pl-14 pr-4">
                <Box
                  state={picked.has(u.n) ? "all" : "none"}
                  label={`${course.title}: ${u.n}. ${u.title}`}
                  onChange={() => setSelection(toggleUnit(getSelection(), course.id, u.n))}
                />
                <span className="flex-1 py-2">
                  {u.n}. {u.title}
                </span>
                <span className="text-xs font-semibold tabular-nums text-soft">{u.count}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
