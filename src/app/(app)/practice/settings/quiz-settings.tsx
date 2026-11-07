"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, ChevronLeft, Clock } from "lucide-react";
import { StartConfirm } from "@/components/quiz/start-confirm";
import { Skeleton } from "@/components/ui/skeleton";
import { newId } from "@/lib/id";
import { manifest } from "@/lib/manifest";
import { useHydrated } from "@/lib/session-store";
import { useSelection } from "@/lib/quiz/selection";
import { courseCapacities } from "@/lib/quiz/selection-logic";
import { getSettings, setPlan, setSettings, useSettings } from "@/lib/quiz/settings";
import {
  MAX_MINUTES, PRESETS, evenPercents, makePlan, resolveSettings, setPercent, type Mode, type Settings,
} from "@/lib/quiz/settings-logic";

const chip = (on: boolean) =>
  `h-11.5 min-w-12 rounded-full px-4 text-sm font-semibold ${on ? "bg-accent/20 text-accent ring-1 ring-accent" : "bg-line/60 text-soft"}`;

function update(patch: Partial<Settings>) {
  setSettings({ ...getSettings(), ...patch });
}

/** A number box that lets you clear it while typing, and snaps back to a valid value when you leave it. */
function NumberField({ label, value, min, max, onCommit }: { label: string; value: number; min: number; max: number; onCommit: (n: number) => void }) {
  const [typing, setTyping] = useState<string | null>(null); // what is being typed; null when not editing
  return (
    <input
      type="number"
      inputMode="numeric"
      aria-label={label}
      min={min}
      max={max}
      value={typing ?? String(value)}
      onChange={(e) => {
        setTyping(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value !== "" && Number.isFinite(n)) onCommit(Math.min(max, Math.max(min, Math.floor(n))));
      }}
      onBlur={() => setTyping(null)}
      className="h-11 w-24 rounded-option border border-line bg-surface px-3 text-center font-semibold focus:border-accent"
    />
  );
}

const thumb =
  "[&::-webkit-slider-thumb]:-mt-2.5 [&::-webkit-slider-thumb]:size-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-md " +
  "[&::-moz-range-thumb]:size-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-surface [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:shadow-md";
const track =
  "[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--accent)_var(--fill),var(--line)_var(--fill))] " +
  "[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-[linear-gradient(to_right,var(--accent)_var(--fill),var(--line)_var(--fill))]";

/** A slider with a big, easy-to-grab handle. With `bubble`, the number being chosen floats above the handle while you drag. */
function BigRange({ label, value, min, max, onChange, bubble = false }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void; bubble?: boolean }) {
  const frac = max > min ? (value - min) / (max - min) : 0;
  return (
    <div className={`relative ${bubble ? "pt-9" : ""}`}>
      {bubble && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-sm font-extrabold tabular-nums text-accent-ink"
          style={{ left: `calc(14px + (100% - 28px) * ${frac})` }}
        >
          {value}
        </span>
      )}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        style={{ "--fill": `${frac * 100}%` } as React.CSSProperties}
        className={`block h-11 w-full cursor-pointer appearance-none bg-transparent ${track} ${thumb}`}
      />
    </div>
  );
}

/** A grey outline of the settings screen while the saved topics and settings load. */
function SettingsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading your settings">
      <Skeleton className="mx-auto h-12 w-44" />
      <Skeleton className="mt-4 h-28 rounded-card" />
      <Skeleton className="mt-6 h-6 w-48" />
      <div className="mt-3 flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-11.5 w-14 rounded-full" />
        ))}
      </div>
      <Skeleton className="mt-6 h-11 w-full rounded-full" />
      <Skeleton className="mt-6 h-6 w-24" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
      </div>
    </div>
  );
}

export function QuizSettings() {
  const router = useRouter();
  const hydrated = useHydrated();
  const selection = useSelection();
  const settings = useSettings();
  const [customCount, setCustomCount] = useState(false);
  const [asking, setAsking] = useState(false);

  const caps = useMemo(() => courseCapacities(selection, manifest.courses), [selection]);
  const r = resolveSettings(settings, caps);
  const ids = caps.map((c) => c.id);

  if (!hydrated) return <SettingsSkeleton />;

  const header = (
    <div className="relative flex h-12 items-center justify-center">
      <Link
        href="/practice"
        aria-label="Back to topics"
        className="absolute left-0 flex h-12 w-12 items-center justify-center rounded-option border border-line bg-surface"
      >
        <ChevronLeft size={20} aria-hidden />
      </Link>
      <h1 className="text-lg font-bold">Quiz settings</h1>
    </div>
  );

  if (caps.length === 0) {
    return (
      <>
        {header}
        <p className="mt-6 text-soft">No topics picked yet. Go back and pick at least one.</p>
        <Link href="/practice" className="mt-4 inline-flex h-12 items-center rounded-option bg-accent px-5 font-bold text-accent-ink">
          Pick topics
        </Link>
      </>
    );
  }

  const presetOn = !customCount && (PRESETS as readonly number[]).includes(r.count) ? r.count : null;
  const custom = settings.mix === "custom" && caps.length > 1;
  const canStart = r.count >= 1 && r.mixOk;

  function start() {
    const plan = makePlan(selection, settings, caps, newId());
    if (!plan) return;
    setPlan(plan);
    router.push("/quiz");
  }

  return (
    <>
      {header}

      <section className="mt-4 rounded-card border border-line bg-surface p-4" aria-label="Your topics">
        <p className="text-xs font-bold uppercase tracking-wide text-soft">Your topics</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {caps.map((c) => (
            <li key={c.id} className="rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent">
              {c.title} · {c.chapters}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-note text-soft">{r.max} questions available</p>
      </section>

      <h2 className="mt-6 text-lg font-extrabold">How many questions?</h2>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Number of questions">
        {PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            disabled={n > r.max}
            aria-pressed={presetOn === n}
            onClick={() => {
              setCustomCount(false);
              update({ count: n });
            }}
            className={`${chip(presetOn === n)} disabled:opacity-40`}
          >
            {n}
          </button>
        ))}
        <button type="button" aria-pressed={presetOn === null} onClick={() => setCustomCount(true)} className={chip(presetOn === null)}>
          Custom
        </button>
      </div>
      {presetOn === null && (
        <div className="mt-3 flex items-center gap-3">
          <NumberField label="Custom number of questions" value={r.count} min={1} max={r.max} onCommit={(n) => update({ count: n })} />
          <span className="text-sm text-soft">of {r.max}</span>
        </div>
      )}
      <div className="mt-2">
        <BigRange label="Number of questions" value={r.count} min={1} max={r.max} onChange={(n) => update({ count: n })} bubble />
      </div>
      <div className="flex justify-between text-note text-soft">
        <span>1</span>
        <span>Max {r.max}</span>
      </div>
      {r.clamped && <p className="mt-2 text-note font-semibold text-warn">Only {r.max} questions are available for your topics.</p>}

      <h2 className="mt-6 text-lg font-extrabold">Mode</h2>
      <div className="mt-3 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Mode">
        {(
          [
            { mode: "practice", title: "Practice", text: "Instant answers and explanations", Icon: Check },
            { mode: "exam", title: "Exam", text: "Timed. Results at the end", Icon: Clock },
          ] as const satisfies readonly { mode: Mode; title: string; text: string; Icon: typeof Check }[]
        ).map(({ mode, title, text, Icon }) => {
          const on = settings.mode === mode;
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => update({ mode })}
              className={`rounded-card border p-4 text-left ${on ? "border-accent bg-accent/10" : "border-line bg-surface"}`}
            >
              <Icon size={20} className={on ? "text-accent" : "text-soft"} aria-hidden />
              <p className="mt-3 font-bold">{title}</p>
              <p className="mt-1 text-note text-soft">{text}</p>
            </button>
          );
        })}
      </div>

      {settings.mode === "exam" && (
        <section className="mt-4 rounded-card border border-line bg-surface p-4" aria-label="Exam time">
          <p className="font-bold">Time</p>
          <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Exam time">
            <button type="button" aria-pressed={settings.timeMode === "auto"} onClick={() => update({ timeMode: "auto" })} className={chip(settings.timeMode === "auto")}>
              1 min per question · {r.count} min
            </button>
            <button type="button" aria-pressed={settings.timeMode === "custom"} onClick={() => update({ timeMode: "custom" })} className={chip(settings.timeMode === "custom")}>
              Custom
            </button>
          </div>
          {settings.timeMode === "custom" && (
            <div className="mt-3 flex items-center gap-3">
              <NumberField label="Exam time in minutes" value={r.minutes} min={1} max={MAX_MINUTES} onCommit={(n) => update({ minutes: n })} />
              <span className="text-sm text-soft">minutes</span>
            </div>
          )}
        </section>
      )}

      {caps.length > 1 && (
        <section className="mt-6 rounded-card border border-line bg-surface p-4" aria-label="Mix between courses">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">Mix between courses</h2>
            <div className="flex rounded-full bg-line/60 p-1" role="group" aria-label="Mix type">
              {(["even", "custom"] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={settings.mix === kind}
                  onClick={() => update(kind === "even" ? { mix: "even" } : { mix: "custom", percents: r.percents })}
                  className={`h-11 rounded-full px-4 text-sm font-bold capitalize ${settings.mix === kind ? "bg-surface text-accent shadow-sm" : "text-soft"}`}
                >
                  {kind}
                </button>
              ))}
            </div>
          </div>

          <ul className="mt-4 space-y-4">
            {caps.map((c) => (
              <li key={c.id}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-bold">{c.title}</span>
                  <span>
                    <b>{r.percents[c.id]}%</b> <span className="text-note text-soft">· {r.counts[c.id]} questions</span>
                  </span>
                </div>
                {custom ? (
                  <div className="mt-1">
                    <BigRange label={`Share for ${c.title}`} value={r.percents[c.id]} min={0} max={100} onChange={(n) => update({ percents: setPercent(r.percents, ids, c.id, n) })} />
                  </div>
                ) : (
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" aria-hidden>
                    <div className="h-full rounded-full bg-accent" style={{ width: `${r.percents[c.id]}%` }} />
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between text-note">
            <span className={r.mixOk ? "text-soft" : "font-bold text-bad"} role={r.mixOk ? undefined : "alert"}>
              Total {r.totalPercent}%{r.mixOk ? "" : " — must add up to 100%"}
            </span>
            <button
              type="button"
              onClick={() => update({ mix: "even", percents: evenPercents(ids) })}
              className="min-h-11 font-bold text-accent"
            >
              Reset to even
            </button>
          </div>
        </section>
      )}

      {/* Start button repeats the count so there are no surprises */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20">
        <div className="mx-auto max-w-md rounded-t-sheet border border-b-0 border-line bg-surface px-5 pb-4 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
          <button
            type="button"
            onClick={() => setAsking(true)}
            disabled={!canStart}
            className="h-12 w-full rounded-option bg-accent font-bold text-accent-ink disabled:bg-line disabled:text-soft"
          >
            {canStart ? `Start quiz · ${r.count} questions` : "Mix must add up to 100%"}
          </button>
        </div>
      </div>

      {asking && (
        <StartConfirm
          title="Ready to start?"
          lines={[
            { label: "Questions", value: String(r.count) },
            { label: "Mode", value: settings.mode === "exam" ? "Exam (no feedback until the end)" : "Practice (instant answers)" },
            { label: "Time", value: settings.mode === "exam" ? `${r.minutes} minutes` : "No time limit" },
            ...(caps.length > 1 ? [{ label: "Mix", value: settings.mix === "custom" ? "Your percentages" : "Even split" }] : []),
          ]}
          topics={caps.map((c) => `${c.title} · ${c.chapters} ${c.chapters === 1 ? "chapter" : "chapters"}${caps.length > 1 ? ` · ${r.counts[c.id]} questions` : ""}`)}
          topicsTitle="Courses and chapters"
          onClose={() => setAsking(false)}
          onStart={start}
        />
      )}
    </>
  );
}
