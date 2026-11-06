"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { AcademicSourcePicker } from "@/components/military/academic-source-picker";
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
  const missing = parts.filter((p) => p.count < 1).map((p) => SECTIONS.find((s) => s.id === p.section)!.title);
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
    <div className="pb-28">
      <div className="relative flex h-12 items-center justify-center">
        <Link href={`/home/military/${course}`} aria-label="Back to Military" className="absolute left-0 flex h-12 w-12 items-center justify-center rounded-option border border-line bg-surface">
          <ChevronLeft size={20} aria-hidden />
        </Link>
        <h1 className="text-lg font-bold">{militaryTitle(course)} · Mock test</h1>
      </div>

      {sources.length > 0 && (
        <div className="mt-4">
          <AcademicSourcePicker sources={sources} value={sourceId} onChange={setSourceId} />
        </div>
      )}

      <ol className="mt-4 space-y-3">
        {parts.map((p, i) => {
          const meta = SECTIONS.find((s) => s.id === p.section)!;
          return (
            <li key={p.section} className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface p-4">
              <span>
                <span className="text-xs font-bold uppercase tracking-wide text-soft">Part {i + 1} · {meta.group}</span>
                <span className="block font-bold">{meta.title}</span>
              </span>
              <span className="text-right text-sm">
                {p.count > 0 ? (
                  <>
                    <b>{p.count}</b> questions<br />
                    <span className="text-soft">{p.minutes} min</span>
                  </>
                ) : (
                  <span className="font-semibold text-bad">No questions yet</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm text-soft">Total time {total} min. Each part starts as soon as the last one ends, and ends by itself when its time is up.</p>

      <section className="mt-5 rounded-card border border-military/50 bg-military/10 p-4">
        <p className="font-bold">Pass rule</p>
        <p className="mt-1 text-sm">You need at least <b>{PASS_MARK}%</b> in <b>each</b> of the three parts to go on to the next round. A high score in one part does not make up for a low one.</p>
      </section>

      {!isPatternSet(pattern) && (
        <p className="mt-3 text-xs text-soft">The numbers of questions and minutes above are examples. The owner sets the real pattern for {militaryTitle(course)} in Military setup.</p>
      )}
      {missing.length > 0 && <p role="alert" className="mt-3 text-sm font-semibold text-bad">A full mock needs questions in every part. Missing: {missing.join(", ")}.</p>}
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-bad">{error}</p>}

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20">
        <div className="mx-auto max-w-md rounded-t-sheet border border-b-0 border-line bg-surface px-5 pb-4 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
          <button type="button" onClick={() => { setError(""); setAsking(true); }} disabled={missing.length > 0 || busy} className="h-12 w-full rounded-option bg-accent font-bold text-accent-ink disabled:bg-line disabled:text-soft">
            {missing.length > 0 ? "Not ready: some parts have no questions" : "Start the mock test"}
          </button>
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