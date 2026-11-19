"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Sheet } from "@/components/quiz/sheet";
import { WHATS_NEW_KEY, latestReleaseId, unseenReleases, type Release } from "@/lib/whats-new";

// "Should the window show?" is read from the phone's storage. Closing it saves the newest release id and tells the window to hide.
let closed = false;
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const unseen = (): Release[] => {
  if (closed) return [];
  try {
    return unseenReleases(localStorage);
  } catch {
    return []; // storage blocked: just do not show it
  }
};
// useSyncExternalStore compares snapshots by identity, so the answer is a stable "key" string rather than a fresh array
const wantedKey = () => unseen().map((r) => r.id).join("|");

const List = ({ items, quiet = false }: { items: readonly string[]; quiet?: boolean }) => (
  <ul className={`list-disc space-y-1.5 pl-5 text-sm leading-relaxed ${quiet ? "text-soft" : ""}`}>
    {items.map((t) => (
      <li key={t}>{t}</li>
    ))}
  </ul>
);

/** Shown on Home after an update: only the releases this phone has not seen, newest first. Remembers on the phone that they were seen. */
export function WhatsNew() {
  const key = useSyncExternalStore(subscribe, wantedKey, () => "");

  // a brand-new visitor starts on the current release, so they are not shown notes about changes they never had
  useEffect(() => {
    try {
      if (localStorage.getItem(WHATS_NEW_KEY) === null && unseenReleases(localStorage).length === 0) localStorage.setItem(WHATS_NEW_KEY, latestReleaseId());
    } catch {
      // not critical
    }
  }, []);

  function close() {
    try {
      localStorage.setItem(WHATS_NEW_KEY, latestReleaseId());
    } catch {
      // not critical
    }
    closed = true;
    listeners.forEach((l) => l());
  }

  if (!key) return null;
  const [latest, ...earlier] = unseen();
  if (!latest) return null;
  return (
    <Sheet title="What's new" onClose={close}>
      <div className="mt-3 space-y-4">
        <section aria-label={earlier.length > 0 ? "New in this update" : "What's new"}>
          {earlier.length > 0 && <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-soft">New in this update</h3>}
          <List items={latest.items} />
        </section>
        {earlier.length > 0 && (
          <section aria-label="Earlier updates">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-soft">Earlier updates</h3>
            <div className="space-y-3">
              {earlier.map((r) => (
                <List key={r.id} items={r.items} quiet />
              ))}
            </div>
          </section>
        )}
      </div>
      <button type="button" onClick={close} className="mt-5 h-12 w-full rounded-option bg-accent font-bold text-accent-ink">
        Got it
      </button>
    </Sheet>
  );
}
