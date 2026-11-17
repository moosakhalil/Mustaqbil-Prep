"use client";

import { useEffect, useSyncExternalStore } from "react";
import { AI_DAILY_LIMIT, aiLevel, minutesToPkMidnight, untilReset, type AiLevel } from "./ai-limit";
import { pkDay } from "./streak";

// How many AI requests a signed-in person has left today, kept in one place so every screen shows the same number.
// It is read once (GET /api/ai/usage), then every AI reply carries the new count (setAiLeft), and it resets itself at midnight Pakistan time.

type State = { left: number | null; day: string };
const SERVER: State = { left: null, day: "" };
let state: State = { left: null, day: "" };
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;

const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** Use the count an AI reply carried. Ignores anything that is not a number. */
export function setAiLeft(left: unknown): void {
  if (typeof left !== "number" || !Number.isFinite(left)) return;
  state = { left: Math.max(0, Math.min(AI_DAILY_LIMIT, Math.floor(left))), day: pkDay(new Date()) };
  emit();
}

/** Ask the server how many are left. Quiet on failure (offline, guest): the chip simply is not shown. */
export function refreshAiLeft(): Promise<void> {
  if (inflight) return inflight;
  inflight = fetch("/api/ai/usage")
    .then(async (res) => {
      if (res.ok) setAiLeft(((await res.json()) as { left?: unknown }).left);
    })
    .catch(() => {})
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export type AiQuota = { left: number; limit: number; level: AiLevel; resetIn: string };

/** The live count for a signed-in person, or null (guest, offline, or not loaded yet). */
export function useAiQuota(signedIn: boolean): AiQuota | null {
  const s = useSyncExternalStore(subscribe, () => state, () => SERVER);

  useEffect(() => {
    if (!signedIn) return;
    if (state.left === null || state.day !== pkDay(new Date())) void refreshAiLeft();
    // a new day starts at midnight Pakistan time: look again then, and whenever the app comes back to the front on a new day
    const timer = window.setTimeout(() => void refreshAiLeft(), minutesToPkMidnight(new Date()) * 60_000 + 1_000);
    const onVisible = () => {
      if (document.visibilityState === "visible" && state.day !== pkDay(new Date())) void refreshAiLeft();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [signedIn]);

  if (!signedIn || s.left === null) return null;
  // a count from an earlier day is not shown as today's
  const left = s.day === pkDay(new Date()) ? s.left : AI_DAILY_LIMIT;
  return { left, limit: AI_DAILY_LIMIT, level: aiLevel(left), resetIn: untilReset(new Date()) };
}
