"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronRight, CircleCheck, TriangleAlert } from "lucide-react";
import { AcademicSourcePicker } from "@/components/military/academic-source-picker";
import { BackTitle } from "@/components/military/back-title";
import { StartConfirm } from "@/components/quiz/start-confirm";
import { academicSources, type AcademicSourceId } from "@/lib/military-academic";
import { SECTIONS, militaryTitle } from "@/lib/military";
import type { SubjectRow } from "@/lib/military-data";
import { startMock, planParts } from "@/lib/military-mock";
import { isPatternSet, type Pattern } from "@/lib/military-pattern";
import { PASS_MARK } from "@/lib/military-rules";

/** The full mock test: three timed parts one after another, ending with the pass rule. */
export function MockStart({ course, subjects: ownerSubjects, pattern }: { course: string; subjects: SubjectRow[]; pattern: Pattern }) {
  const router = useRouter();
  const sources = useMemo(() => academicSources(course, ownerSubjects), [course, ownerSubjects]);
  const [sourceId, setSourceId] = useState<AcademicSourceId>(() => (sources.some((s) => s.id === "course") ? "course" : "past"));
  const subjects = sources.find((s) => s.id === sourceId)?.subjects ?? [];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [asking, setAsking] = useState(false);
  const parts = planParts(pattern, subjects);
  const missingParts = parts.filter((p) => p.count < 1).map((p) => SECTIONS.find((s) => s.id === p.section)!);
  const missing = missingParts.map((s) => s.title);
  const total = parts.reduce((t, p) => t + p.minutes, 0);

  async function start() {
    setBusy(true);
    setError("");
    try {
      if (await startMock(course, subjects, pattern)) router.push("/quiz");
      else setError("The mock test could not be built. Check that every part has questions.");
    } catch {
      setError("Could not load the questions. Check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <div className="pb-44">
      <BackTitle href={`/home/military/${course}`} label={militaryTitle(course)} title={`${militaryTitle(course)} · Mock test`} />

      {!isPatternSet(pattern) && (
        <p role="note" className="mt-4 flex items-start gap-3 rounded-card border border-warn bg-warn/10 p-3 text-note">
          <TriangleAlert size={22} className="mt-0.5 shrink-0 text-warn" aria-hidden />
          <span><b>Example numbers.</b> The counts and times below are placeholders until the real test pattern for {militaryTitle(course)} is set.</span>
        </p>
      )}

      {sources.length > 0 && (
        <div className="mt-4">
          <AcademicSourcePicker sources={sources} value={sourceId} onChange={setSourceId} />
        </div>
      )}

      <ol className="mt-4 space-y-2">
        {parts.map((p, i) => {
          const meta = SECTIONS.find((s) => s.id === p.section)!;
          const ok = p.count > 0;
          return (
            <li key={p.section} className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
              <span aria-hidden className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-extrabold text-bg ${ok ? "bg-military" : "bg-bad"}`}>{ok ? i + 1 : "!"}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold uppercase tracking-wide text-soft">Part {i + 1} · {meta.group}</span>
                <span className="block font-bold">{meta.title}</span>
                <span className="block text-note text-soft">{ok ? <><b className="text-text">{p.count}</b> questions · {p.minutes} min</> : "No questions yet"}</span>
              </span>
              {!ok && (
                <Link href={`/military/${course}/${p.section}`} aria-label={`Fix ${meta.title}`} className="flex min-h-11 shrink-0 items-center gap-0.5 text-note font-bold text-bad">
                  Fix <ChevronRight size={16} aria-hidden />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 flex items-center justify-between text-note">
        <span className="text-soft">Total time</span>
        <b>{total} min</b>
      </p>
      <p className="mt-1 text-note text-soft">Each part starts as soon as the last one ends, and ends by itself when its time is up.</p>

      <section className="mt-4 flex items-start gap-3 rounded-card border border-military/50 bg-military/10 p-4">
        <CircleCheck size={22} className="mt-0.5 shrink-0 text-military" aria-hidden />
        <p className="text-sm"><b>Pass rule:</b> you need <b>{PASS_MARK}%</b> or more in <b>each</b> of the three parts to go on to the next round. A high score in one part does not make up for a low one.</p>
      </section>

      {error && <p role="alert" className="mt-3 text-sm font-semibold text-bad">{error}</p>}

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20">
        <div className="mx-auto max-w-md rounded-t-sheet border border-b-0 border-line bg-surface px-5 pb-3 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
          {missingParts.length > 0 ? (
            <>
              <p role="status" className="mb-2 text-center text-note font-bold text-bad">
                {missing.join(" and ")} {missing.length === 1 ? "has" : "have"} no questions yet
              </p>
              <Link href={`/military/${course}/${missingParts[0].id}`} className="flex h-12 w-full items-center justify-center gap-1 rounded-option border-2 border-bad font-bold text-bad">
                Fix {missingParts[0].title} <ChevronRight size={18} aria-hidden />
              </Link>
            </>
          ) : (
            <button type="button" onClick={() => { setError(""); setAsking(true); }} disabled={busy} className="h-12 w-full rounded-option bg-accent font-bold text-accent-ink disabled:bg-line disabled:text-soft">
              Start the mock test
            </button>
          )}
        </div>
      </div>

      {asking && (
        <StartConfirm
          title={`${militaryTitle(course)} · Mock test`}
          lines={[
            { label: "Parts", value: "3, one after another" },
            { label: "Questions", value: String(parts.reduce((t, p) => t + p.count, 0)) },
            { label: "Total time", value: `${total} minutes` },
            { label: "Mode", value: "Exam (no feedback until the end)" },
          ]}
          topics={parts.map((p, i) => `Part ${i + 1}: ${SECTIONS.find((s) => s.id === p.section)!.title} · ${p.count} questions · ${p.minutes} min`)}
          topicsTitle="Parts"
          note={`You need ${PASS_MARK}% in each part to be eligible for the next round. Each part ends by itself when its time is up.`}
          confirmLabel="Start the test"
          busy={busy}
          error={error}
          onClose={() => setAsking(false)}
          onStart={start}
        />
      )}
    </div>
  );
}