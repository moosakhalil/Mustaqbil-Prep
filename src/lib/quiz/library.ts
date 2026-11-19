import { useMemo, useSyncExternalStore } from "react";
import { markGone } from "@/lib/progress-queue";
import { createBrowserStore } from "@/lib/session-store";
import { getAttempt, setAttempt, useAttempt } from "./attempt";
import { isFinished, sanitizeAttempt, type Attempt } from "./attempt-logic";
import { setPlan } from "./settings";
import {
  begin, hasRoom, purgeExpired, quizzesOf, removeMockOf, removeOf, resumeOf, unfinishedOf, type Library,
} from "./library-logic";

// The quizzes set aside while another one is on screen. The one on screen stays in the "attempt" store.
const shelfStore = createBrowserStore<Attempt[]>(
  "mp.shelf.v1",
  [],
  (raw) => (Array.isArray(raw) ? raw.map(sanitizeAttempt).filter((a): a is Attempt => a !== null && a.finishedAt === null) : []),
  "local",
);

export const getShelf = shelfStore.get;
export const setShelf = shelfStore.set;

function snapshot(): Library {
  return { active: getAttempt(), shelf: shelfStore.get() };
}

function commit(lib: Library) {
  shelfStore.set(lib.shelf);
  setAttempt(lib.active);
}

/** All unfinished quizzes and the current mock part on this phone, newest first. Drives the Continue list on Home. */
export function useSavedList(): Attempt[] {
  const active = useAttempt();
  const shelf = shelfStore.useStore();
  return useMemo(() => unfinishedOf({ active, shelf }), [active, shelf]);
}

/** Remove progress nobody touched for 14 days (also tells the account). Call when the app opens. */
export function expireOld(now = Date.now()) {
  const before = snapshot();
  const after = purgeExpired(before, now);
  if (after === before) return;
  const keep = new Set(unfinishedOf(after).map((a) => a.id));
  unfinishedOf(before).filter((a) => !keep.has(a.id)).forEach((a) => markGone(a.id));
  commit(after);
}

// ---- starting a new quiz ----------------------------------------------------------------------------------------

/** A new quiz that could not start yet because the student must first choose what to remove. */
export type PendingStart = { kind: "quiz" | "mock"; next: Attempt; dropMock?: () => void };

let pending: PendingStart | null = null;
const pendingListeners = new Set<() => void>();
const setPending = (p: PendingStart | null) => {
  pending = p;
  pendingListeners.forEach((l) => l());
};
export const usePendingStart = () =>
  useSyncExternalStore(
    (cb) => {
      pendingListeners.add(cb);
      return () => {
        pendingListeners.delete(cb);
      };
    },
    () => pending,
    () => null,
  );
export const cancelPendingStart = () => setPending(null);

/**
 * Put a new quiz on screen. The quiz that was there is kept (set aside) instead of being replaced.
 * "blocked" means three quizzes are already saved (or a mock test is): a window asks the student which one to remove.
 * `mockSlotFull` is true when a new mock test would replace one that is still in progress.
 */
export function beginAttempt(next: Attempt, opts: { mockSlotFull?: boolean; dropMock?: () => void } = {}): "started" | "blocked" {
  const lib = purgeExpired(snapshot(), Date.now());
  if (opts.mockSlotFull) {
    setPending({ kind: "mock", next, dropMock: opts.dropMock });
    return "blocked";
  }
  if (!next.mockId && !hasRoom(lib)) {
    setPending({ kind: "quiz", next });
    return "blocked";
  }
  commit(begin(lib, next));
  return "started";
}

/** The student chose what to remove: do it and start the waiting quiz. */
export function confirmPendingStart(deleteId?: string) {
  const p = pending;
  if (!p) return;
  if (p.kind === "mock") p.dropMock?.(); // removes the old mock and its saved parts
  else if (deleteId) {
    markGone(deleteId);
    commit(removeOf(snapshot(), deleteId));
  }
  commit(begin(snapshot(), p.next));
  setPending(null);
}

// ---- resuming and deleting ----------------------------------------------------------------------------------------

/** Bring a saved quiz to the screen so /quiz opens it. The clock stays paused until the quiz screen opens. */
export function resumeSaved(id: string) {
  setPlan(null); // the quiz screen must not rebuild a quiz from an old setup
  commit(resumeOf(snapshot(), id));
}

export function deleteSaved(id: string) {
  markGone(id);
  commit(removeOf(snapshot(), id));
}

/** Remove every part of a mock test from the saved list (the mock itself is removed by the caller). */
export function deleteMockParts(mockId: string) {
  const lib = snapshot();
  const parts = unfinishedOf(lib).filter((a) => a.mockId === mockId);
  parts.forEach((a) => markGone(a.id));
  commit(removeMockOf(lib, mockId));
}

/** Every unfinished attempt on this phone right now (not a hook: for the sync code). */
export const listSaved = () => unfinishedOf(snapshot());

/** Add a saved quiz that came from the account, or replace this phone's older copy of it. */
export function upsertSaved(a: Attempt) {
  const lib = snapshot();
  if (lib.active?.id === a.id) {
    if (!isFinished(lib.active)) setAttempt(a);
    return;
  }
  shelfStore.set([...lib.shelf.filter((x) => x.id !== a.id), a]);
}

export const savedQuizCount = () => quizzesOf(snapshot()).length;
