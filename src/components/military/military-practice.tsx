"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clock, ListChecks } from "lucide-react";
import { StartConfirm } from "@/components/quiz/start-confirm";
import { MILITARY_COURSES, militaryTitle } from "@/lib/military";
import { academicSources } from "@/lib/military-academic";
import { intelligenceBank, subjectCount, type SubjectRow } from "@/lib/military-data";
import type { Pattern } from "@/lib/military-pattern";
import { PASS_MARK } from "@/lib/military-rules";
import { startMixed } from "@/lib/quiz/military-quiz";
import type { Mode } from "@/lib/quiz/settings-logic";

const nf = new Intl.NumberFormat("en");
const chip = (on: boolean) => `h-10 min-w-12 rounded-full px-4 text-sm font-semibold ${on ? "bg-accent/20 text-accent ring-1 ring-accent" : "bg-line/60 text-soft"}`;

type Row = { key: string; title: string; total: number; subject?: SubjectRow; intel?: "verbal" | "nonverbal" };
type Group = { id: string; title: string; rows: Row[] };

/** The same subject can come from several lists (past papers, important, the owner's list): keep it once. */
const identity = (s: SubjectRow) => (s.source === "military" ? `file:${s.militaryFile}` : `deg:${s.degreeCourse}:${(s.units ?? []).join(",")}`);

function buildGroups(course: string, owner: SubjectRow[]): Group[] {
  const sources = academicSources(course, owner);
  const seen = new Set<string>();
  const take = (list: SubjectRow[], keep: (s: SubjectRow) => boolean): Row[] => {
    const out: Row[] = [];
    for (const s of list) {
      const id = identity(s);
      if (seen.has(id) || !keep(s) || subjectCount(s) === 0) continue;
      seen.add(id);
      out.push({ key: id, title: s.title.replace(/^Imp · /, ""), total: subjectCount(s), subject: s });
    }
    return out;
  };
  const past = sources.find((s) => s.id === "past")?.subjects ?? [];
  const important = sources.find((s) => s.id === "important")?.subjects ?? [];
  const mine = sources.find((s) => s.id === "course")?.subjects ?? [];
  const everything = [...past, ...important, ...mine];

  const verbal = intelligenceBank("verbal")?.total ?? 0;
  const nonverbal = intelligenceBank("nonverbal")?.total ?? 0;
  const groups: Group[] = [
    { id: "intel", title: "Intelligence", rows: [
      ...(verbal ? [{ key: "verbal", title: "Verbal", total: verbal, intel: "verbal" as const }] : []),
      ...(nonverbal ? [{ key: "nonverbal", title: "Non-verbal (pictures)", total: nonverbal, intel: "nonverbal" as const }] : []),
    ] },
    { id: "past", title: "Academic: past papers by topic", rows: take(everything, (s) => /-pp-/.test(s.militaryFile ?? "")) },
    { id: "banks", title: "Academic: practice banks", rows: take(everything, (s) => s.source === "military") },
    { id: "degree", title: "Academic: degree subjects", rows: take(everything, (s) => s.source === "degree") },
  ];
  return groups.filter((g) => g.rows.length > 0);
}

/** Practice, Military side: tick any Verbal, Non-verbal or Academic topics (like the Academia builder), set the size, go. */
export function MilitaryPractice({ course, subjects, pattern }: { course: string; subjects: SubjectRow[]; pattern: Pattern }) {
  const router = useRouter();
  const groups = useMemo(() => buildGroups(course, subjects), [course, subjects]);
  const rows = useMemo(() => groups.flatMap((g) => g.rows), [groups]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<"pick" | "size">("pick");
  const [count, setCount] = useState(20);
  const [mode, setMode] = useState<Mode>("practice");
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const chosen = rows.filter((r) => picked.has(r.key));
  const available = chosen.reduce((t, r) => t + r.total, 0);
  const n = Math.min(count, available);
  const toggle = (key: string) => setPicked((p) => { const next = new Set(p); if (!next.delete(key)) next.add(key); return next; });
  const setGroup = (g: Group, on: boolean) => setPicked((p) => { const next = new Set(p); g.rows.forEach((r) => (on ? next.add(r.key) : next.delete(r.key))); return next; });

  // exam time: the pattern's minutes per question for the parts ticked (one minute each when the pattern is not set)
  const parts = [...new Set(chosen.map((r) => r.intel ?? "academic"))] as ("verbal" | "nonverbal" | "academic")[];
  const perQuestion = parts.length
    ? parts.reduce((t, p) => {
        const c = pattern[`${p}Count` as keyof Pattern] as number;
        const m = pattern[`${p}Minutes` as keyof Pattern] as number;
        return t + (c > 0 && m > 0 ? m / c : 1);
      }, 0) / parts.length
    : 1;
  const minutes = Math.max(1, Math.round(perQuestion * n));

  async function start() {
    setBusy(true);
    setError("");
    try {
      const ok = await startMixed({
        course,
        intelligence: chosen.filter((r) => r.intel).map((r) => r.intel!),
        subjects: chosen.filter((r) => r.subject).map((r) => r.subject!),
        count: n, mode, minutes,
      });
      if (ok) router.push("/quiz");
      else setError("No questions could be loaded for this choice.");
    } catch {
      setError("Could not load the questions. Check your connection and try again.");
    }
    setBusy(false);
  }

  const courseTitle = militaryTitle(course);

  return (
    <div className="pb-44">
      <h1 className="text-center text-lg font-bold">Build your quiz</h1>

      <div className="mt-4 flex gap-2">
        <Link href="/practice" className="rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent opacity-70">Academia</Link>
        <span aria-current="page" className="rounded-full bg-military px-3 py-1.5 text-xs font-extrabold text-bg">Military</span>
      </div>

      <nav aria-label="Course" className="mt-4 grid grid-cols-4 gap-2">
        {MILITARY_COURSES.map((c) => (
          <Link
            key={c.id}
            href={`/practice/military?course=${c.id}`}
            aria-current={c.id === course ? "page" : undefined}
            className={`flex h-11 items-center justify-center rounded-option text-sm font-extrabold ${c.id === course ? "bg-military text-bg" : "border border-line bg-surface text-soft"}`}
          >
            {c.title}
          </Link>
        ))}
      </nav>

      {step === "pick" ? (
        <>
          <div className="mt-2 flex items-center justify-end gap-1 text-xs font-semibold text-accent">
            <button type="button" onClick={() => setPicked(new Set(rows.map((r) => r.key)))} className="min-h-12 px-1">Select all</button>
            <span aria-hidden>·</span>
            <button type="button" onClick={() => setPicked(new Set())} className="min-h-12 px-1">Clear</button>
          </div>

          {rows.length === 0 ? (
            <p className="mt-2 rounded-card border border-line bg-surface p-4 text-sm text-soft">No questions have been added for {courseTitle} yet.</p>
          ) : (
            <div className="space-y-4">
              {groups.map((g) => {
                const all = g.rows.every((r) => picked.has(r.key));
                return (
                  <section key={g.id} aria-label={g.title}>
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-extrabold uppercase tracking-wide text-soft">{g.title}</h2>
                      <button type="button" onClick={() => setGroup(g, !all)} className="min-h-10 px-1 text-xs font-semibold text-accent">{all ? "Untick all" : "Tick all"}</button>
                    </div>
                    <ul className="mt-1 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
                      {g.rows.map((r) => (
                        <li key={r.key}>
                          <label className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2">
                            <input type="checkbox" checked={picked.has(r.key)} onChange={() => toggle(r.key)} aria-label={r.title} className="h-5 w-5 shrink-0 cursor-pointer accent-accent" />
                            <span className="flex-1 font-bold">{r.title}</span>
                            <span className="text-xs font-semibold tabular-nums text-soft">{nf.format(r.total)}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}

          <Link href={`/military/${course}/mock`} className="mt-5 flex h-12 items-center justify-center gap-2 rounded-option border border-military font-extrabold text-military">
            Full mock test instead <ChevronRight size={18} aria-hidden />
          </Link>
          <p className="mt-2 text-xs text-soft">Pass: {PASS_MARK}% or more in each of the three parts. Verbal and Non-verbal are the same for all four courses.</p>
        </>
      ) : (
        <div className="mt-4">
          <button type="button" onClick={() => setStep("pick")} className="flex min-h-12 items-center gap-1 text-sm font-bold text-accent">
            <ChevronLeft size={18} aria-hidden /> Change topics
          </button>
          <p className="rounded-card border border-line bg-surface p-4 text-sm">
            <b>{chosen.length}</b> {chosen.length === 1 ? "topic" : "topics"} · <b>{nf.format(available)}</b> questions to draw from
          </p>

          <h2 className="mt-6 text-lg font-extrabold">How many questions?</h2>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Number of questions">
            {[10, 20, 30, 50, 84].filter((x) => x < available).map((x) => (
              <button key={x} type="button" aria-pressed={n === x} onClick={() => setCount(x)} className={chip(n === x)}>{x}</button>
            ))}
            <button type="button" aria-pressed={n === available} onClick={() => setCount(available)} className={chip(n === available)}>All {nf.format(available)}</button>
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
          {chosen.some((r) => r.intel === "nonverbal") && <p className="mt-3 text-xs text-soft">Figure questions: choose a tile, then press Confirm. Tap the figure to zoom.</p>}
        </div>
      )}

      {/* Sticky bar, like the Academia builder: running total and the next button, above the bottom navigation */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20">
        <div className="mx-auto max-w-md rounded-t-sheet border border-b-0 border-line bg-surface px-5 pb-4 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold">{courseTitle} · {chosen.length} {chosen.length === 1 ? "topic" : "topics"}</p>
            <p className="flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent">
              <ListChecks size={14} aria-hidden />
              {nf.format(available)} questions
            </p>
          </div>
          {available === 0 ? (
            <button type="button" disabled className="mt-3 flex h-12 w-full items-center justify-center rounded-option bg-line font-bold text-soft">Pick at least one topic</button>
          ) : step === "pick" ? (
            <button type="button" onClick={() => setStep("size")} className="mt-3 flex h-12 w-full items-center justify-center gap-1 rounded-option bg-accent font-bold text-accent-ink">
              Next: set quiz size <ChevronRight size={18} aria-hidden />
            </button>
          ) : (
            <button type="button" disabled={busy} onClick={() => { setError(""); setAsking(true); }} className="mt-3 h-12 w-full rounded-option bg-accent font-bold text-accent-ink disabled:opacity-60">
              Start · {n} questions
            </button>
          )}
        </div>
      </div>

      {asking && (
        <StartConfirm
          title={`${courseTitle} · Custom practice`}
          lines={[
            { label: "Course", value: courseTitle },
            { label: "Questions", value: String(n) },
            { label: "Mode", value: mode === "exam" ? "Exam (no feedback until the end)" : "Practice (instant answers)" },
            { label: "Time", value: mode === "exam" ? `${minutes} minutes` : "No time limit" },
          ]}
          topics={chosen.map((r) => `${r.title} · ${nf.format(r.total)} questions`)}
          topicsTitle="Topics"
          busy={busy}
          error={error}
          onClose={() => setAsking(false)}
          onStart={start}
        />
      )}
    </div>
  );
}
