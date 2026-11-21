import { isLessonKey } from "./index";

// Which lessons a student has marked as read. Reading is only ever added, so the phone's list and the account's list are simply joined.

/** Whatever was saved on the phone (possibly old or damaged) as a clean list of known lesson keys, without repeats. */
export function sanitizeRead(raw: unknown): string[] {
  return Array.isArray(raw) ? [...new Set(raw.filter(isLessonKey))] : [];
}

/** The joined list, and the keys the account does not have yet (to be sent). Keys the app no longer knows are dropped. */
export function mergeRead(local: readonly string[], server: readonly unknown[]): { merged: string[]; toPush: string[] } {
  const theirs = new Set(sanitizeRead(server));
  const mine = sanitizeRead(local);
  return { merged: [...new Set([...mine, ...theirs])], toPush: mine.filter((k) => !theirs.has(k)) };
}
