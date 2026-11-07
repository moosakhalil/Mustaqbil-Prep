"use client";

import { Sheet } from "./sheet";

export type StartLine = { label: string; value: string };

const SHOWN_TOPICS = 8;

/**
 * "Ready to start?" window shown before any quiz starts: what the quiz is made of (topics, number of questions, mode, time)
 * and a clear Start or Cancel. Nothing starts until Start is pressed.
 */
export function StartConfirm({
  title, lines, topics, topicsTitle = "Topics", note, busy = false, error = "", confirmLabel = "Start quiz", onStart, onClose,
}: {
  title: string;
  lines: StartLine[];
  topics?: string[];
  topicsTitle?: string;
  note?: string;
  busy?: boolean;
  error?: string;
  confirmLabel?: string;
  onStart: () => void;
  onClose: () => void;
}) {
  const more = topics && topics.length > SHOWN_TOPICS ? topics.length - SHOWN_TOPICS : 0;
  return (
    <Sheet title={title} onClose={busy ? () => {} : onClose}>
      <p className="mt-1 text-sm text-soft">Here is what is in this quiz. Do you want to start?</p>

      <dl className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line">
        {lines.map((l) => (
          <div key={l.label} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
            <dt className="text-sm text-soft">{l.label}</dt>
            <dd className="text-right text-sm font-bold">{l.value}</dd>
          </div>
        ))}
      </dl>

      {topics && topics.length > 0 && (
        <section className="mt-4" aria-label={topicsTitle}>
          <p className="text-xs font-bold uppercase tracking-wide text-soft">{topicsTitle}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {topics.slice(0, SHOWN_TOPICS).map((t) => (
              <li key={t} className="rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent">{t}</li>
            ))}
            {more > 0 && <li className="rounded-full bg-line/60 px-3 py-1.5 text-xs font-semibold text-soft">and {more} more</li>}
          </ul>
        </section>
      )}

      {note && <p className="mt-4 text-note text-soft">{note}</p>}
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-bad">{error}</p>}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button type="button" onClick={onClose} disabled={busy} className="h-12 rounded-option border border-line font-bold disabled:opacity-60">
          Not now
        </button>
        <button type="button" onClick={onStart} disabled={busy} className="h-12 rounded-option bg-accent font-bold text-accent-ink disabled:opacity-60">
          {busy ? "Starting…" : confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}
