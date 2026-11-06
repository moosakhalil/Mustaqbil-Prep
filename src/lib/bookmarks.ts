import { useEffect } from "react";
import { createBrowserStore } from "./session-store";

// Bookmarked question ids of the signed-in person. Loaded once per tab, then changed straight away on screen
// (the server call follows, and the change is undone if it fails).
const store = createBrowserStore<string[] | null>("mp.bookmarks.v1", null, (raw) => (Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : null));

let loading = false;

async function load() {
  if (loading) return;
  loading = true;
  try {
    const res = await fetch("/api/bookmarks");
    if (res.ok) store.set(((await res.json()) as { ids: string[] }).ids);
  } catch {
    // offline: bookmarks stay unknown until the next time
  } finally {
    loading = false;
  }
}

/** The bookmarked ids, or null while they are still loading (or for guests). */
export function useBookmarks(signedIn: boolean): ReadonlySet<string> | null {
  const ids = store.useStore();
  useEffect(() => {
    if (signedIn && ids === null) void load();
  }, [signedIn, ids]);
  return ids ? new Set(ids) : null;
}

export async function toggleBookmark(questionId: string): Promise<void> {
  const before = store.get() ?? [];
  const had = before.includes(questionId);
  store.set(had ? before.filter((x) => x !== questionId) : [...before, questionId]);
  try {
    const res = await fetch("/api/bookmarks", {
      method: had ? "DELETE" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ questionId }),
    });
    if (!res.ok) throw new Error(String(res.status));
  } catch {
    store.set(before); // undo
  }
}
