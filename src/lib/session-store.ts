import { useSyncExternalStore } from "react";

/**
 * A tiny shared store kept in the browser: it survives a refresh and moves between screens.
 * "session" is cleared when the tab closes; "local" stays until it is removed (used for a quiz in progress).
 * `sanitize` turns whatever was saved (possibly old or damaged) into a valid value.
 */
export function createBrowserStore<T>(key: string, empty: T, sanitize: (raw: unknown) => T, kind: "session" | "local" = "session") {
  let state = empty;
  let loaded = false;
  const listeners = new Set<() => void>();
  const storage = () => (kind === "local" ? localStorage : sessionStorage);

  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const saved = storage().getItem(key);
      if (saved !== null) state = sanitize(JSON.parse(saved));
    } catch {
      // storage blocked or damaged: start empty
    }
  }

  function get(): T {
    load();
    return state;
  }

  function set(next: T) {
    load();
    state = next;
    try {
      storage().setItem(key, JSON.stringify(next));
    } catch {
      // private mode or full: the value still works for this page
    }
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function useStore(): T {
    return useSyncExternalStore(subscribe, get, () => empty);
  }

  return { get, set, useStore };
}

/** Kept for the existing session stores. */
export const createSessionStore = <T>(key: string, empty: T, sanitize: (raw: unknown) => T) => createBrowserStore(key, empty, sanitize, "session");

/** False while the server renders and during hydration, true afterwards. Lets a screen wait for saved values instead of flashing empty. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** The current time, refreshed every `ms`. Zero on the server. */
export function useNow(ms = 1000): number {
  return useSyncExternalStore(
    (cb) => {
      const t = setInterval(cb, ms);
      return () => clearInterval(t);
    },
    () => Math.floor(Date.now() / ms) * ms,
    () => 0,
  );
}
