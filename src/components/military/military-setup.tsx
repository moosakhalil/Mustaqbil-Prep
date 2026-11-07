"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, Check, CircleAlert, Plus, Trash2 } from "lucide-react";
import { manifest } from "@/lib/manifest";
import { MILITARY_COURSES } from "@/lib/military";
import { academicBanks, bankById, subjectCount, type SubjectRow } from "@/lib/military-data";
import type { Pattern } from "@/lib/military-pattern";
import { RECOMMENDED, suggestionsFor } from "@/lib/military-suggest";

const chip = (on: boolean) => `h-11 rounded-full px-4 text-sm font-semibold ${on ? "bg-military text-bg" : "bg-line/60 text-soft"}`;
const field = "h-11 rounded-option border border-line bg-bg px-3 focus:border-accent";

async function call(method: string, url: string, body: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) return null;
    return ((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Something went wrong";
  } catch {
    return "No connection";
  }
}

/** Owner only: build the Academic subjects of each military course, and set the real test pattern. */
export function MilitarySetup({ subjects, patterns }: { subjects: Record<string, SubjectRow[]>; patterns: Record<string, Pattern> }) {
  const router = useRouter();
  const [course, setCourse] = useState<string>(MILITARY_COURSES[0].id);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [undo, setUndo] = useState<SubjectRow | null>(null);

  const list = subjects[course] ?? [];
  const sug = suggestionsFor(course);

  async function run(fn: () => Promise<string | null>, ok = "Saved.") {
    setBusy(true);
    setMessage("");
    setUndo(null);
    const err = await fn();
    setMessage(err ?? ok);
    setFailed(!!err);
    setBusy(false);
    if (!err) router.refresh();
  }

  /** Remove a subject. The owner can undo straight after: that adds it back (at the end of the list). */
  async function remove(s: SubjectRow) {
    setConfirmId(null);
    await run(() => call("DELETE", "/api/admin/subjects", { id: s.id }), `Removed "${s.title}".`);
    setUndo(s);
  }
  function restore(s: SubjectRow) {
    const body = s.source === "military"
      ? { course, source: "military", militaryFile: s.militaryFile, title: s.title }
      : { course, source: "degree", degreeCourse: s.degreeCourse, units: s.units, title: s.title };
    return run(() => call("POST", "/api/admin/subjects", body), `Added "${s.title}" back.`);
  }

  const addDegree = (degreeCourse: string, units: number[] | null, title?: string) =>
    call("POST", "/api/admin/subjects", { course, source: "degree", degreeCourse, units, title: title ?? manifest.courses.find((c) => c.id === degreeCourse)!.title });

  return (
    <div>
      <h1 className="text-lg font-bold">Military setup</h1>
      <p className="mt-1 text-sm text-soft">Owner only. Build each course&apos;s Academic subjects and set the real test pattern.</p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Course">
        {MILITARY_COURSES.map((c) => (
          <button key={c.id} type="button" aria-pressed={course === c.id} onClick={() => { setCourse(c.id); setMessage(""); setFailed(false); setUndo(null); setConfirmId(null); }} className={chip(course === c.id)}>
            {c.title}
          </button>
        ))}
      </div>

      {/* Always on screen while you scroll, so you can see that a change was saved */}
      <div role="status" className={`sticky top-2 z-30 mt-3 flex items-center gap-2 rounded-card border p-2 pl-3 text-note font-semibold shadow-sm ${failed ? "border-bad bg-bad/10 text-bad" : message ? "border-ok bg-surface text-ok" : "border-line bg-surface text-soft"}`}>
        {busy ? (
          <span className="flex-1">Saving…</span>
        ) : message ? (
          <>
            {failed ? <CircleAlert size={18} className="shrink-0" aria-hidden /> : <Check size={18} className="shrink-0" aria-hidden />}
            <span className="min-w-0 flex-1">{failed ? message : `Saved. ${message}`}</span>
            {undo && !failed && (
              <button type="button" onClick={() => restore(undo)} className="min-h-11 shrink-0 rounded-option px-3 font-extrabold text-accent underline">Undo</button>
            )}
          </>
        ) : (
          <span className="flex-1">Changes save by themselves.</span>
        )}
      </div>

      <QuickSetup
        key={`q-${course}`}
        course={course}
        existing={list}
        busy={busy}
        onAdd={(items) =>
          run(async () => {
            for (const it of items) {
              const err = await call("POST", "/api/admin/subjects", { course, source: "military", militaryFile: it.file, title: it.title });
              if (err) return `${it.title}: ${err}`;
            }
            return null;
          }, `Added ${items.length} ${items.length === 1 ? "subject" : "subjects"}.`)
        }
        onAddDegree={(ids) =>
          run(async () => {
            for (const id of ids) {
              const err = await addDegree(id, null);
              if (err) return err;
            }
            return null;
          }, `Added ${ids.length} degree ${ids.length === 1 ? "course" : "courses"}.`)
        }
        suggestedDegree={sug.important}
      />

      <h2 className="mt-6 font-extrabold">Academic subjects</h2>
      {list.length === 0 ? (
        <p className="mt-2 text-sm text-soft">None yet. Add subjects below.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {list.map((s, i) => (
            <li key={s.id} className="px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-40 flex-1">
                  <input
                    defaultValue={s.title}
                    aria-label={`Name of ${s.title}`}
                    onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== s.title && run(() => call("PATCH", "/api/admin/subjects", { id: s.id, title: e.target.value.trim() }))}
                    className="min-h-11 w-full rounded-option border border-transparent bg-transparent px-2 font-bold focus:border-accent"
                  />
                  <span className="block px-2 text-note text-soft">
                    {s.source === "degree" ? `Degree: ${manifest.courses.find((c) => c.id === s.degreeCourse)?.title ?? s.degreeCourse}${s.units ? ` (${s.units.length} chapters)` : " (whole course)"}` : `Military material: ${s.militaryFile}`} · {subjectCount(s)} questions
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <button type="button" disabled={busy || i === 0} onClick={() => run(() => call("PATCH", "/api/admin/subjects", { id: s.id, move: "up" }))} aria-label={`Move ${s.title} up`} className="flex h-11 w-11 items-center justify-center rounded-option border border-line disabled:opacity-40"><ArrowUp size={18} aria-hidden /></button>
                  <button type="button" disabled={busy || i === list.length - 1} onClick={() => run(() => call("PATCH", "/api/admin/subjects", { id: s.id, move: "down" }))} aria-label={`Move ${s.title} down`} className="flex h-11 w-11 items-center justify-center rounded-option border border-line disabled:opacity-40"><ArrowDown size={18} aria-hidden /></button>
                  <button type="button" disabled={busy} onClick={() => setConfirmId(s.id)} aria-label={`Remove ${s.title}`} aria-expanded={confirmId === s.id} className="ml-4 flex h-11 w-11 items-center justify-center rounded-option border border-bad text-bad"><Trash2 size={18} aria-hidden /></button>
                </span>
              </div>
              {confirmId === s.id && (
                <div role="group" aria-label={`Remove ${s.title}?`} className="mt-2 rounded-option border border-bad bg-bad/10 p-3">
                  <p className="text-sm font-bold">Remove &quot;{s.title}&quot; from {MILITARY_COURSES.find((c) => c.id === course)?.title}?</p>
                  <p className="text-note text-soft">You can undo this right after.</p>
                  <div className="mt-2 flex gap-2">
                    {/* Cancel is the safe choice, so it gets the focus */}
                    <button type="button" autoFocus onClick={() => setConfirmId(null)} className="h-11 flex-1 rounded-option border border-line bg-surface font-bold">Cancel</button>
                    <button type="button" disabled={busy} onClick={() => remove(s)} className="h-11 flex-1 rounded-option bg-bad font-bold text-bg disabled:opacity-60">Delete</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <AddSubject key={course} course={course} existing={list} busy={busy} onAddDegree={(d, u, t) => run(() => addDegree(d, u, t), "Subject added.")} onAddMilitary={(file, title) => run(() => call("POST", "/api/admin/subjects", { course, source: "military", militaryFile: file, title }), "Subject added.")} suggestions={sug} />

      <PatternEditor key={`p-${course}`} course={course} initial={patterns[course]} busy={busy} onSave={(p) => run(() => call("PUT", "/api/admin/pattern", { course, ...p }), "Pattern saved.")} />
    </div>
  );
}

/** One tap to add the recommended past-paper subjects (and the suggested degree courses) to the chosen course. Skips what is already there. */
function QuickSetup({
  course, existing, busy, suggestedDegree, onAdd, onAddDegree,
}: {
  course: string; existing: SubjectRow[]; busy: boolean; suggestedDegree: string[];
  onAdd: (items: { file: string; title: string }[]) => void; onAddDegree: (ids: string[]) => void;
}) {
  const items = (RECOMMENDED[course] ?? [])
    .map((r) => ({ file: `academic-${course}-${r.bank}`, title: r.title }))
    .filter((r) => bankById(r.file));
  const have = new Set(existing.filter((s) => s.source === "military").map((s) => s.militaryFile));
  const haveDegree = new Set(existing.filter((s) => s.source === "degree").map((s) => s.degreeCourse));
  const todo = items.filter((r) => !have.has(r.file));
  const [off, setOff] = useState<Set<string>>(new Set());
  const chosen = todo.filter((r) => !off.has(r.file));
  const degreeTodo = suggestedDegree.filter((id) => !haveDegree.has(id) && manifest.courses.some((c) => c.id === id));
  if (items.length === 0 && degreeTodo.length === 0) return null;

  return (
    <section className="mt-5 rounded-card border-2 border-military/50 bg-military/10 p-4" aria-label="Quick setup">
      <h2 className="font-extrabold">Quick setup: recommended subjects for {MILITARY_COURSES.find((c) => c.id === course)?.title}</h2>
      <p className="mt-1 text-xs text-soft">From the topics the past papers repeat most. Already-added subjects are skipped. You can rename, reorder or remove anything afterwards.</p>

      {items.length > 0 && (
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-option border border-line bg-surface">
          {items.map((r) => {
            const added = have.has(r.file);
            return (
              <li key={r.file}>
                <label className={`flex min-h-11 items-center gap-3 px-3 py-1.5 ${added ? "opacity-60" : "cursor-pointer"}`}>
                  <input
                    type="checkbox"
                    checked={added || !off.has(r.file)}
                    disabled={added}
                    onChange={() => setOff((p) => { const n = new Set(p); if (!n.delete(r.file)) n.add(r.file); return n; })}
                    className="h-5 w-5 accent-accent"
                  />
                  <span className="flex-1 text-sm font-semibold">{r.title}</span>
                  <span className="text-note tabular-nums text-soft">{added ? "Added" : `${bankById(r.file)?.total} questions`}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <button type="button" disabled={busy || chosen.length === 0} onClick={() => onAdd(chosen)} className="mt-3 h-12 w-full rounded-option bg-military font-bold text-bg disabled:opacity-50">
        {chosen.length === 0 ? "All recommended subjects are added" : `Add the recommended set (${chosen.length})`}
      </button>
      {degreeTodo.length > 0 && (
        <button type="button" disabled={busy} onClick={() => onAddDegree(degreeTodo)} className="mt-2 h-12 w-full rounded-option border border-line bg-surface font-bold disabled:opacity-50">
          Also add the suggested degree courses ({degreeTodo.length})
        </button>
      )}
    </section>
  );
}

function AddSubject({
  course, existing, busy, suggestions, onAddDegree, onAddMilitary,
}: {
  course: string; existing: SubjectRow[]; busy: boolean; suggestions: { important: string[]; also: string[] };
  onAddDegree: (course: string, units: number[] | null, title: string) => void; onAddMilitary: (file: string, title: string) => void;
}) {
  const [source, setSource] = useState<"degree" | "military">("degree");
  const [pick, setPick] = useState("");
  const [units, setUnits] = useState<Set<number> | null>(null); // null = whole course
  const [title, setTitle] = useState("");
  const [bank, setBank] = useState("");
  const banks = academicBanks(course);
  const used = new Set(existing.filter((s) => s.source === "degree").map((s) => s.degreeCourse));
  const selected = manifest.courses.find((c) => c.id === pick);
  const byId = (id: string) => manifest.courses.find((c) => c.id === id);
  const rest = manifest.courses.filter((c) => !suggestions.important.includes(c.id) && !suggestions.also.includes(c.id));

  const SuggestRow = ({ id }: { id: string }) => {
    const c = byId(id);
    if (!c) return null;
    return (
      <li className="flex items-center gap-3 px-3 py-2">
        <span className="min-w-0 flex-1 text-sm"><b>{c.title}</b> <span className="text-note text-soft">{c.total} questions</span></span>
        {used.has(id) ? <span className="text-note font-semibold text-ok">Added</span> : (
          <button type="button" disabled={busy} onClick={() => onAddDegree(id, null, c.title)} className="flex h-11 items-center gap-1 rounded-full bg-accent/15 px-4 text-sm font-bold text-accent"><Plus size={14} aria-hidden /> Add</button>
        )}
      </li>
    );
  };

  return (
    <section className="mt-8">
      <h2 className="font-extrabold">Add a subject</h2>
      <div className="mt-2 flex gap-2" role="group" aria-label="Source">
        <button type="button" aria-pressed={source === "degree"} onClick={() => setSource("degree")} className={chip(source === "degree")}>From degree courses</button>
        <button type="button" aria-pressed={source === "military"} onClick={() => setSource("military")} className={chip(source === "military")}>From military material</button>
      </div>

      {source === "degree" ? (
        <div className="mt-3 space-y-4">
          {suggestions.important.length > 0 ? (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-soft">Suggested: important for this preparation</p>
                <button type="button" disabled={busy} onClick={() => suggestions.important.filter((id) => !used.has(id)).forEach((id) => onAddDegree(id, null, byId(id)!.title))} className="min-h-11 px-1 text-sm font-bold text-accent">Add all</button>
              </div>
              <ul className="mt-1 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">{suggestions.important.map((id) => <SuggestRow key={id} id={id} />)}</ul>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-soft">Also useful</p>
              <ul className="mt-1 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">{suggestions.also.map((id) => <SuggestRow key={id} id={id} />)}</ul>
              <p className="mt-2 text-xs text-soft">This is a starting suggestion until the official syllabus is supplied. You decide what each course really needs.</p>
            </div>
          ) : (
            <p className="rounded-card border border-line bg-surface p-3 text-sm text-soft">No suggestions for this course yet. Pick degree courses below.</p>
          )}

          <div className="rounded-card border border-line bg-surface p-3">
            <p className="font-bold">Choose a course and chapters</p>
            <select value={pick} onChange={(e) => { setPick(e.target.value); setUnits(null); setTitle(byId(e.target.value)?.title ?? ""); }} aria-label="Degree course" className={`${field} mt-2 w-full`}>
              <option value="">Select a degree course…</option>
              {[...suggestions.important, ...suggestions.also].length > 0 && (
                <optgroup label="Suggested">{[...suggestions.important, ...suggestions.also].map((id) => <option key={id} value={id}>{byId(id)?.title}</option>)}</optgroup>
              )}
              <optgroup label="All courses">{rest.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</optgroup>
            </select>
            {selected && (
              <>
                <label className="mt-3 flex min-h-11 items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" checked={units === null} onChange={() => setUnits(units === null ? new Set() : null)} className="h-5 w-5 accent-accent" /> Whole course ({selected.total} questions)
                </label>
                {units !== null && (
                  <ul className="mt-1 max-h-56 overflow-y-auto rounded-option border border-line">
                    {selected.units.map((u) => (
                      <li key={u.n}>
                        <label className="flex min-h-11 items-center gap-2 px-3 text-sm">
                          <input type="checkbox" checked={units.has(u.n)} onChange={() => setUnits((prev) => { const next = new Set(prev); if (!next.delete(u.n)) next.add(u.n); return next; })} className="h-5 w-5 accent-accent" />
                          <span className="flex-1">{u.n}. {u.title}</span><span className="text-note text-soft">{u.count}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
                <input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Subject name" placeholder="Subject name" className={`${field} mt-3 w-full`} />
                <button type="button" disabled={busy || !title.trim() || (units !== null && units.size === 0)} onClick={() => onAddDegree(selected.id, units ? [...units] : null, title.trim())} className="mt-3 h-12 w-full rounded-option bg-accent font-bold text-accent-ink disabled:opacity-50">Add subject</button>
              </>
            )}
          </div>
        </div>
      ) : banks.length === 0 ? (
        <p className="mt-3 rounded-card border border-line bg-surface p-3 text-sm text-soft">
          No converted Academic files for this course yet. Put <code>academic-{course}-subject-name.json</code> in the <b>military</b> folder (next to the jsons folder) and run <code>pnpm data:military</code>.
        </p>
      ) : (
        <div className="mt-3 rounded-card border border-line bg-surface p-3">
          <select value={bank} onChange={(e) => { setBank(e.target.value); setTitle(banks.find((b) => b.id === e.target.value)?.title ?? ""); }} aria-label="Military file" className={`${field} w-full`}>
            <option value="">Select a file…</option>
            {banks.map((b) => <option key={b.id} value={b.id}>{b.title} ({b.total})</option>)}
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Subject name" placeholder="Subject name" className={`${field} mt-3 w-full`} />
          <button type="button" disabled={busy || !bank || !title.trim()} onClick={() => onAddMilitary(bank, title.trim())} className="mt-3 h-12 w-full rounded-option bg-accent font-bold text-accent-ink disabled:opacity-50">Add subject</button>
        </div>
      )}
    </section>
  );
}

function PatternEditor({ course, initial, busy, onSave }: { course: string; initial: Pattern; busy: boolean; onSave: (p: Pattern) => void }) {
  const [p, setP] = useState<Pattern>(initial);
  const set = (k: keyof Pattern, v: string) => setP((prev) => ({ ...prev, [k]: Math.max(0, Math.min(600, Math.floor(Number(v) || 0))) }));
  const rows: [string, keyof Pattern, keyof Pattern][] = [
    ["Verbal", "verbalCount", "verbalMinutes"],
    ["Non-verbal", "nonverbalCount", "nonverbalMinutes"],
    ["Academic", "academicCount", "academicMinutes"],
  ];
  return (
    <section className="mt-8 pb-6">
      <h2 className="font-extrabold">Test pattern for {course}</h2>
      <p className="text-xs text-soft">The real number of questions and minutes in each part. Leave 0 until you know them: the app then uses example numbers.</p>
      <div className="mt-3 space-y-3">
        {rows.map(([name, c, m]) => (
          <div key={name} className="grid grid-cols-[1fr_5.5rem_5.5rem] items-center gap-2">
            <span className="font-bold">{name}</span>
            <label className="text-xs text-soft">Questions<input type="number" inputMode="numeric" min={0} max={500} value={p[c]} onChange={(e) => set(c, e.target.value)} className={`${field} mt-1 w-full`} /></label>
            <label className="text-xs text-soft">Minutes<input type="number" inputMode="numeric" min={0} max={600} value={p[m]} onChange={(e) => set(m, e.target.value)} className={`${field} mt-1 w-full`} /></label>
          </div>
        ))}
      </div>
      <button type="button" disabled={busy} onClick={() => onSave(p)} className="mt-4 h-12 w-full rounded-option bg-accent font-bold text-accent-ink disabled:opacity-60">Save pattern</button>
    </section>
  );
}
