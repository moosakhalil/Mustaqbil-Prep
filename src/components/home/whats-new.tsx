"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Sheet } from "@/components/quiz/sheet";
import { WHATS_NEW, WHATS_NEW_KEY, shouldShowWhatsNew } from "@/lib/whats-new";

// "Should the window show?" is read from the phone's storage. Closing it saves the release id and tells the window to hide.
let closed = false;
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const wanted = () => {
  if (closed) return false;
  try {
    return shouldShowWhatsNew(localStorage);
  } catch {
    return false; // storage blocked: just do not show it
  }
};

/** Shown once on Home after an update: what was added. Remembers on the phone that it was seen. */
export function WhatsNew() {
  const open = useSyncExternalStore(subscribe, wanted, () => false);

  // a brand-new visitor starts on the current release, so they are not shown notes about changes they never had
  useEffect(() => {
    try {
      if (localStorage.getItem(WHATS_NEW_KEY) === null && !shouldShowWhatsNew(localStorage)) localStorage.setItem(WHATS_NEW_KEY, WHATS_NEW.id);
    } catch {
      // not critical
    }
  }, []);

  function close() {
    try {
      localStorage.setItem(WHATS_NEW_KEY, WHATS_NEW.id);
    } catch {
      // not critical
    }
    closed = true;
    listeners.forEach((l) => l());
  }

  if (!open) return null;
  return (
    <Sheet title={WHATS_NEW.title} onClose={close}>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">
        {WHATS_NEW.items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <button type="button" onClick={close} className="mt-5 h-12 w-full rounded-option bg-accent font-bold text-accent-ink">
        Got it
      </button>
    </Sheet>
  );
}
