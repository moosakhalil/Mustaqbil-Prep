import { useSyncExternalStore } from "react";
import { clearDirty, clearGone, goneIds, markDirty } from "./progress-queue";
import { getMock, mockInProgress, sanitizeMock, setMock, type Mock } from "./military-mock";
import { loadCourse } from "./question-loader";
import { isFinished, type Attempt } from "./quiz/attempt-logic";
import { listSaved, upsertSaved } from "./quiz/library";
import { EXPIRE_MS } from "./quiz/library-logic";
import { fromRecord, toRecord } from "./quiz/progress-record";

// A signed-in student's unfinished quizzes are kept in the account too. The phone is always saved first and the account copy
// follows after every answer. When the app opens, the two are compared and the newer copy of each quiz wins.

const headers = { "content-type": "application/json" };

/** ok: saved. later: offline, signed out or server trouble, so try again. refused: the account will never take it. */
async function send(init: RequestInit, query = ""): Promise<"ok" | "later" | "refused"> {
  try {
    const res = await fetch(`/api/saved${query}`, { ...init, headers, keepalive: true });
    // "not found" counts as done only when deleting (nothing left to remove); a save that gets 404 must be tried again
    if (res.ok || (res.status === 404 && init.method === "DELETE")) return "ok";
    return res.status === 400 || res.status === 409 ? "refused" : "later";
  } catch {
    return "later";
  }
}

async function putQuiz(a: Attempt) {
  const result = await send({ method: "PUT", body: JSON.stringify({ kind: "quiz", record: toRecord(a) }) });
  if (result === "later") markDirty(a.id);
  else clearDirty(a.id);
}

async function putMock(m: Mock) {
  const key = `mock:${m.id}`;
  const result = await send({ method: "PUT", body: JSON.stringify({ kind: "mock", state: m }) });
  if (result === "later") markDirty(key);
  else clearDirty(key);
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();

/** Save an unfinished quiz in the account soon. It waits a moment so a quick run of answers is sent once; `now` sends straight away. */
export function pushAttempt(a: Attempt, now = false) {
  if (isFinished(a)) return;
  const old = timers.get(a.id);
  if (old) clearTimeout(old);
  if (now) {
    timers.delete(a.id);
    void putQuiz(a);
    return;
  }
  timers.set(
    a.id,
    setTimeout(() => {
      timers.delete(a.id);
      void putQuiz(a);
    }, 700),
  );
}

export function pushMock(m: Mock) {
  if (mockInProgress(m)) void putMock(m);
}

/** Tell the account about quizzes finished or deleted here. Stops quietly when offline. */
export async function flushGone() {
  for (const id of goneIds()) {
    const result = await send({ method: "DELETE" }, `?id=${encodeURIComponent(id)}`);
    if (result === "later") return;
    clearGone(id);
  }
}

type ServerSnapshot = { quizzes: { record: { id?: string }; activityAt: number }[]; mock: { state: unknown; touchedAt: number } | null };

let syncing = false;

/** Compare this phone with the account and bring both up to date. Call when the app opens, never while a quiz is on screen. */
export async function syncProgress(): Promise<void> {
  if (syncing) return;
  syncing = true;
  try {
    await flushGone();
    let snapshot: ServerSnapshot;
    try {
      const res = await fetch("/api/saved");
      if (!res.ok) return; // signed out or server trouble
      snapshot = (await res.json()) as ServerSnapshot;
    } catch {
      return; // offline: this phone's copy stays the working copy
    }
    const gone = new Set(goneIds());
    const now = Date.now();
    const local = new Map(listSaved().map((a) => [a.id, a]));
    const seen = new Set<string>();

    for (const item of snapshot.quizzes) {
      const id = item.record.id;
      if (typeof id !== "string" || gone.has(id)) continue;
      seen.add(id);
      const mine = local.get(id);
      if (mine && mine.enteredAt >= item.activityAt) {
        if (mine.enteredAt > item.activityAt) await putQuiz(mine);
        continue;
      }
      if (now - item.activityAt >= EXPIRE_MS) continue;
      const theirs = await fromRecord(item.record, loadCourse);
      if (theirs) upsertSaved(theirs);
    }
    // quizzes that exist only on this phone (made as a guest, or while offline) go up now
    for (const a of local.values()) if (!seen.has(a.id) && !gone.has(a.id)) await putQuiz(a);

    await syncMock(snapshot.mock, gone);
  } finally {
    syncing = false;
  }
}

async function syncMock(server: { state: unknown; touchedAt: number } | null, gone: Set<string>) {
  const mine = getMock();
  const theirs = server ? sanitizeMock(server.state) : null;
  if (theirs && !gone.has(`mock:${theirs.id}`)) {
    if (!mine || mine.done) {
      if (!mine || mine.id !== theirs.id) setMock(theirs); // a finished mock does not block the one from the account
    } else if (theirs.touchedAt > mine.touchedAt) setMock(theirs);
    else if (mine.touchedAt > theirs.touchedAt || mine.id !== theirs.id) await putMock(mine);
    return;
  }
  if (mine && !mine.done && !gone.has(`mock:${mine.id}`)) await putMock(mine);
}

/** False while the phone has no connection. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}
