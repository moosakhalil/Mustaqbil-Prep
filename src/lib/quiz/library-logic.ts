import { isFinished, settleAttempt, type Attempt } from "./attempt-logic";

// The student's unfinished quizzes: the one on screen (`active`, which may also be a finished quiz showing its result)
// plus the others set aside on the `shelf`. Up to SAVED_LIMIT quizzes and one mock test at a time.

export const SAVED_LIMIT = 3;
/** Unfinished progress is removed after this long without any activity. */
export const EXPIRE_MS = 14 * 24 * 60 * 60 * 1000;

export type Library = { active: Attempt | null; shelf: Attempt[] };

const newestFirst = (a: Attempt, b: Attempt) => b.enteredAt - a.enteredAt;

/** Every unfinished attempt (quizzes and the current mock part), newest activity first. */
export function unfinishedOf(lib: Library): Attempt[] {
  const all = lib.active && !isFinished(lib.active) ? [lib.active, ...lib.shelf] : [...lib.shelf];
  return all.sort(newestFirst);
}

/** The unfinished quizzes that count against the limit: everything except the part of a mock test (the mock has its own slot). */
export function quizzesOf(lib: Library): Attempt[] {
  return unfinishedOf(lib).filter((a) => !a.mockId);
}

/** True when another quiz may start without removing one first. */
export const hasRoom = (lib: Library) => quizzesOf(lib).length < SAVED_LIMIT;

/** Put the unfinished quiz on screen away on the shelf (its clock stopped), so a new one can take the screen. A finished one is simply dropped. */
export function park(lib: Library): Library {
  if (!lib.active) return lib;
  if (isFinished(lib.active)) return { active: null, shelf: lib.shelf };
  return { active: null, shelf: [...lib.shelf.filter((a) => a.id !== lib.active!.id), settleAttempt(lib.active)] };
}

/** `next` takes the screen; whatever unfinished quiz was there goes to the shelf. */
export function begin(lib: Library, next: Attempt): Library {
  const parked = park(lib);
  return { active: next, shelf: parked.shelf.filter((a) => a.id !== next.id) };
}

/** Bring a saved quiz to the screen (its clock stays paused until the quiz screen opens). */
export function resumeOf(lib: Library, id: string): Library {
  if (lib.active?.id === id) return lib;
  const target = lib.shelf.find((a) => a.id === id);
  if (!target) return lib;
  const parked = park({ active: lib.active, shelf: lib.shelf.filter((a) => a.id !== id) });
  return { active: settleAttempt(target), shelf: parked.shelf };
}

export function removeOf(lib: Library, id: string): Library {
  return { active: lib.active?.id === id ? null : lib.active, shelf: lib.shelf.filter((a) => a.id !== id) };
}

export function removeMockOf(lib: Library, mockId: string): Library {
  return {
    active: lib.active?.mockId === mockId && !isFinished(lib.active) ? null : lib.active,
    shelf: lib.shelf.filter((a) => a.mockId !== mockId),
  };
}

/** Drop unfinished progress nobody touched for 14 days. */
export function purgeExpired(lib: Library, now: number): Library {
  const fresh = (a: Attempt) => now - a.enteredAt < EXPIRE_MS;
  const active = lib.active && !isFinished(lib.active) && !fresh(lib.active) ? null : lib.active;
  const shelf = lib.shelf.filter(fresh);
  return active === lib.active && shelf.length === lib.shelf.length ? lib : { active, shelf };
}
