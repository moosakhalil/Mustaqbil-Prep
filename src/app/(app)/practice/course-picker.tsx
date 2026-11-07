"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, ListChecks, Search } from "lucide-react";
import { Segmented } from "@/components/ui/segmented";
import { manifest } from "@/lib/manifest";
import type { CourseInfo } from "@/lib/question-types";
import { useSelection, setSelection, getSelection } from "@/lib/quiz/selection";
import { courseState, selectMany, summarize, toggleCourse, toggleUnit, type CheckState, type Selection } from "@/lib/quiz/selection-logic";

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
  // what was ticked before "Clear", kept for a few seconds so it can be put back
  const [undo, setUndo] = useState<Selection | null>(null);

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

  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 6000);
    return () => clearTimeout(t);
  }, [undo]);

  const toggleOpen = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  function clearAll() {
    const before = getSelection();
    if (Object.keys(before).length === 0) return;
    setSelection({});
    setUndo(before);
  }

  function restore() {
    if (undo) setSelection(undo);
    setUndo(null);
  }

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
          className="w-full bg-transparent placeholder:text-soft"
        />
      </label>

      <div className="mt-4">
        <Segmented
          label="Academia or Military"
          items={[
            { label: "Academia", href: "/practice", active: true, tone: "accent" },
            { label: "Military", href: "/practice/military", active: false, tone: "military" },
          ]}
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="text-note text-soft">{manifest.courses.length} courses</p>
        <div className="flex items-center gap-1 text-sm font-semibold text-accent">
          <button
            type="button"
            onClick={() =>
              setSelection(selectMany(getSelection(), visible.map((v) => ({ id: v.course.id, units: v.units.map((u) => u.n) }))))
            }
            className="min-h-11 px-2"
          >
            Select all
          </button>
          <span aria-hidden>·</span>
          <button type="button" onClick={clearAll} className="min-h-11 px-2">
            Clear
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 text-center text-soft">No course or chapter matches “{query}”.</p>
      ) : (
        <ul className="overflow-hidden rounded-card border border-line bg-surface">
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

      {/* room so the last rows are not hidden behind the sticky bar */}
      <div aria-hidden className="h-24" />

      {/* Sticky bar: the running total and the Next button side by side, above the bottom navigation */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20">
        <div className="mx-auto max-w-md">
          {undo && none && (
            <div role="status" className="mx-5 mb-2 flex items-center justify-between gap-3 rounded-option bg-text py-1 pl-4 pr-1 text-bg shadow-lg">
              <span className="text-sm font-semibold">Selection cleared</span>
              <button type="button" onClick={restore} className="min-h-11 rounded-option px-4 text-sm font-extrabold underline">
                Undo
              </button>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 rounded-t-sheet border border-b-0 border-line bg-surface px-5 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
            <div className="min-w-0">
              {none ? (
                <p className="text-sm font-bold">Pick at least one topic</p>
              ) : (
                <>
                  <p className="text-sm font-bold">
                    {summary.courses} {summary.courses === 1 ? "course" : "courses"} · {summary.chapters}{" "}
                    {summary.chapters === 1 ? "chapter" : "chapters"}
                  </p>
                  <p className="flex items-center gap-1.5 text-note font-semibold text-accent">
                    <ListChecks size={14} aria-hidden />
                    {nf.format(summary.questions)} questions
                  </p>
                </>
              )}
            </div>
            {none ? (
              <button type="button" disabled className="flex h-12 shrink-0 items-center justify-center rounded-option bg-line px-6 font-bold text-soft">
                Next
              </button>
            ) : (
              <Link
                href="/practice/settings"
                aria-label="Next: set quiz size"
                className="flex h-12 shrink-0 items-center justify-center gap-1 rounded-option bg-accent px-6 font-bold text-accent-ink"
              >
                Next <ChevronRight size={18} aria-hidden />
              </Link>
            )}
          </div>
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
          <span className="whitespace-nowrap text-note font-semibold tabular-nums text-soft">{nf.format(course.total)} questions</span>
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
                <span className="whitespace-nowrap text-note font-semibold tabular-nums text-soft">{u.count}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
