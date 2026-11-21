import { useEffect, useMemo } from "react";
import { createBrowserStore } from "@/lib/session-store";
import { mergeRead, sanitizeRead } from "./read-logic";

// "Read" ticks for the Study guide. The phone keeps them (so the lists show them at once, even offline) and the account keeps a copy (so they follow
// the student to another phone). A tick made offline is sent the next time the guide opens.

const store = createBrowserStore<string[]>("mp.guide.read.v1", [], sanitizeRead, "local");
const headers = { "content-type": "application/json" };

let synced = false;

async function sync() {
  try {
    const res = await fetch("/api/guide");
    synced = true; // the server answered: do not ask again on every screen
    if (!res.ok) return; // not signed in or the account is not ready: the phone's list stays the working copy
    const { ids } = (await res.json()) as { ids?: unknown };
    const { merged, toPush } = mergeRead(store.get(), Array.isArray(ids) ? ids : []);
    if (merged.length !== store.get().length) store.set(merged);
    for (const lessonKey of toPush) await fetch("/api/guide", { method: "POST", headers, body: JSON.stringify({ lessonKey }) });
  } catch {
    // offline: try again the next time a guide screen opens
  }
}

/** The lessons marked as read. The first screen to use this joins the phone's list with the account's. */
export function useGuideRead(): ReadonlySet<string> {
  const ids = store.useStore();
  useEffect(() => {
    if (!synced) void sync();
  }, []);
  return useMemo(() => new Set(ids), [ids]);
}

/** Mark a lesson read or unread. It changes on screen at once; if the account refuses an "unread" the change is undone. */
export async function setRead(key: string, read: boolean): Promise<void> {
  const before = store.get();
  if (before.includes(key) === read) return;
  store.set(read ? [...before, key] : before.filter((k) => k !== key));
  try {
    const res = await fetch("/api/guide", { method: read ? "POST" : "DELETE", headers, body: JSON.stringify({ lessonKey: key }) });
    if (!res.ok && !read) store.set(before);
  } catch {
    // a tick made offline is kept and sent later; an "unread" that could not be sent is undone so the two lists do not disagree
    if (!read) store.set(before);
  }
}
