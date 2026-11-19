import { createBrowserStore } from "./session-store";

// Small lists kept on the phone so account saving survives being offline:
// quizzes changed here that the account has not heard about yet, and quizzes deleted or finished here that the account still holds.

const idList = (raw: unknown) => (Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string").slice(-50) : []);

const dirty = createBrowserStore<string[]>("mp.sync.dirty.v1", [], idList, "local");
const gone = createBrowserStore<string[]>("mp.sync.gone.v1", [], idList, "local");

export const dirtyIds = dirty.get;
export const goneIds = gone.get;
export const useDirtyCount = () => dirty.useStore().length;

export function markDirty(id: string) {
  if (!dirty.get().includes(id)) dirty.set([...dirty.get(), id]);
}
export const clearDirty = (id: string) => {
  if (dirty.get().includes(id)) dirty.set(dirty.get().filter((x) => x !== id));
};

/** This quiz was finished or deleted here: the copy in the account must go too. */
export function markGone(id: string) {
  clearDirty(id);
  if (!gone.get().includes(id)) gone.set([...gone.get(), id]);
}
export const clearGone = (id: string) => {
  if (gone.get().includes(id)) gone.set(gone.get().filter((x) => x !== id));
};
