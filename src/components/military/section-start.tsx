"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, ChevronLeft, Clock } from "lucide-react";
import { AcademicSourcePicker } from "@/components/military/academic-source-picker";
import { StartConfirm } from "@/components/quiz/start-confirm";
import { academicSources, type AcademicSourceId } from "@/lib/military-academic";
import { SECTIONS, militaryTitle, type SectionId } from "@/lib/military";
import { PASS_MARK } from "@/lib/military-rules";
import { subjectCount, type SubjectRow } from "@/lib/military-data";
import type { Pattern } from "@/lib/military-pattern";
import { sectionAvailable, startSection } from "@/lib/quiz/military-quiz";
import type { Mode } from "@/lib/quiz/settings-logic";

const chip = (on: boolean) => `h-10 min-w-12 rounded-full px-4 text-sm font-semibold ${on ? "bg-accent/20 text-accent ring-1 ring-accent" : "bg-line/60 text-soft"}`;

/** Start one military part (Verbal, Non-verbal or Academic): how many questions, practice or exam. */
export function SectionStart({ course, section, subjects, pattern }: { course: string; section: SectionId; subjects: SubjectRow[]; pattern: Pattern }) {
  const router = useRouter();
  const meta = SECTIONS.find((s) => s.id === section)!;
  const sources = useMemo(() => academicSources(course, subjects), [course, subjects]);
  const [sourceId, setSourceId] = useState<AcademicSourceId>(() => (sources.some((s) => s.id === "course") ? "course" : "past"));
  const list = useMemo(() => (section === "academic" ? sources.find((s) => s.id === sourceId)?.subjects ?? [] : []), [section, sources, sourceId]);
  const [picked, setPicked] = useState<Set<string>>(() => new Set(list.filter((s) => subjectCount(s) > 0).map((s) => s.id)));
  function chooseSource(id: AcademicSourceId) {
    setSourceId(id);
    setPicked(new Set((sources.find((s) => s.id === id)?.subjects ?? []).filter((s) => subjectCount(s) > 0).map((s) => s.id)));
  }
  const [count, setCount] = useState(20);
  const [mode, setMode] = useState<Mode>("practice");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [asking, setAsking] = useState(false);

  const chosen = useMemo(() => list.filter((s) => picked.has(s.id)), [list, picked]);
  const available = sectionAvailable(section, section === "academic" ? chosen : []);
  const n = Math.min(count, available);

  // exam time: the real pattern's time per question when set, otherwise one minute per question
  const setCountP = pattern[`${section}Count` as keyof Pattern] as number;
  const setMinutes = pattern[`${section}Minutes` as keyof Pattern] as number;
  const minutes = setCountP > 0 && setMinutes > 0 ? Math.max(1, Math.round((setMinutes * n) / setCountP)) : Math.max(1, n);

  async function start() {
    setBusy(true);
    setError("");
    try {
      const ok = await startSection({ course, section, subjects: chosen, count: n, mode, minutes });
      if (ok) router.push("/quiz");
      else setError("No questions could be loaded for this part.");
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
        <h1 className="text-lg font-bold">{militaryTitle(course)} · {meta.title}</h1>
      </div>

      {section === "academic" && sources.length > 0 && (
        <div className="mt-4">
          <AcademicSourcePicker sources={sources} value={sourceId} onChange={chooseSource} />
        </div>
      )}

      {section === "academic" && (
        <section className="mt-4" aria-label="Subjects">
          <p className="text-xs font-bold uppercase tracking-wide text-soft">Subjects</p>
          {list.length === 0 ? (
            <p className="mt-2 rounded-card border border-line bg-surface p-4 text-sm text-soft">No Academic questions are available for {militaryTitle(course)} yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
              {list.map((s) => {
                const total = subjectCount(s);
                return (
                  <li key={s.id}>
                    <label className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2">
                      <input
                        type="checkbox"
                        checked={picked.has(s.id)}
                        disabled={total === 0}
                        onChange={() => setPicked((p) => { const next = new Set(p); if (!next.delete(s.id)) next.add(s.id); return next; })}
                        className="h-5 w-5 accent-accent"
                      />
                      <span className="flex-1 font-semibold">{s.title}</span>
                      <span className="text-xs tabular-nums text-soft">{total}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {available === 0 ? (
        <p className="mt-6 rounded-card border border-line bg-surface p-4 text-sm text-soft">
          {section === "academic" ? "Pick at least one subject with questions." : `No ${meta.title} questions have been added yet.`}
        </p>
      ) : (
        <>
          <h2 className="mt-6 text-lg font-extrabold">How many questions?</h2>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Number of questions">
            {[10, 20, 30, 50].filter((x) => x < available).map((x) => (
              <button key={x} type="button" aria-pressed={n === x} onClick={() => setCount(x)} className={chip(n === x)}>{x}</button>
            ))}
            <button type="button" aria-pressed={n === available} onClick={() => setCount(available)} className={chip(n === available)}>All {available}</button>
          </div>

          <h2 className="mt-6 text-lg font-extrabold">Mode</h2>
          <div className="mt-3 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Mode">
            {([["practice", "Practice", "Instant answers", Check], ["exam", "Exam", `Timed, ${minutes} min`, Clock]] as const).map(([m, title, text, Icon]) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={`rounded-card border p-4 text-left ${mode === m ? "border-accent bg-accent/10" : "border-line bg-surface"}`}>
                <Icon size={20} className={mode === m ? "text-accent" : "text-soft"} aria-hidden />
                <p className="mt-3 font-bold">{title}</p>
                <p className="mt-1 text-xs text-soft">{text}</p>
              </button>
            ))}
          </div>
          {section === "nonverbal" && <p className="mt-3 text-xs text-soft">Figure questions: choose a tile, then press Confirm. Tap the figure to zoom.</p>}
          {error && <p role="alert" className="mt-3 text-sm font-semibold text-bad">{error}</p>}
        </>
      )}

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20">
        <div className="mx-auto max-w-md rounded-t-sheet border border-b-0 border-line bg-surface px-5 pb-4 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
          <button type="button" onClick={() => { setError(""); setAsking(true); }} disabled={available === 0 || busy} className="h-12 w-full rounded-option bg-accent font-bold text-accent-ink disabled:bg-line disabled:text-soft">
            {available === 0 ? "Nothing to start yet" : `Start · ${n} questions`}
          </button>
        </div>
      </div>

      {asking && (
        <StartConfirm
          title={`${militaryTitle(course)} · ${meta.title}`}
          lines={[
            { label: "Course", value: militaryTitle(course) },
            { label: "Part", value: `${meta.group}: ${meta.title}` },
            { label: "Questions", value: String(n) },
            { label: "Mode", value: mode === "exam" ? "Exam (no feedback until the end)" : "Practice (instant answers)" },
            { label: "Time", value: mode === "exam" ? `${minutes} minutes` : "No time limit" },
          ]}
          topics={section === "academic" ? chosen.map((s) => `${s.title} · ${subjectCount(s)} questions`) : [`${meta.title} · ${available} questions to draw from`]}
          topicsTitle={section === "academic" ? "Subjects" : "Part"}
          note={`Pass line: ${PASS_MARK}% in this part.`}
          busy={busy}
          error={error}
          onClose={() => setAsking(false)}
          onStart={start}
        />
      )}
    </div>
  );
}
