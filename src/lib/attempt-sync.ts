import { createBrowserStore } from "./session-store";
import { sanitizeAttempt, type Attempt } from "./quiz/attempt-logic";

// Finished quizzes of signed-in users are sent to the server. If the phone is offline (or the server is busy)
// the attempt waits in this outbox on the phone and is sent the next time the app opens or a quiz finishes.
const outbox = createBrowserStore<Attempt[]>(
  "mp.outbox.v1",
  [],
  (raw) => (Array.isArray(raw) ? raw.map(sanitizeAttempt).filter((a): a is Attempt => a !== null && a.finishedAt !== null) : []),
  "local",
);

export const useOutboxCount = () => outbox.useStore().length;

let flushing = false;

/** Send everything waiting in the outbox. Safe to call often. Stops quietly when offline or signed out. */
export async function flushOutbox(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    for (const attempt of outbox.get()) {
      let res: Response;
      try {
        res = await fetch("/api/attempts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(attempt) });
      } catch {
        return; // offline: try again later
      }
      if (res.status === 401) return; // signed out: keep it until the person signs in
      // saved (200/201), already saved (409) or permanently refused (400): either way it must leave the outbox
      if (res.ok || res.status === 409 || res.status === 400) outbox.set(outbox.get().filter((a) => a.id !== attempt.id));
      else return; // server trouble: try again later
    }
  } finally {
    flushing = false;
  }
}

/** Queue a finished attempt for saving and try to send it now. */
export async function submitAttempt(attempt: Attempt): Promise<void> {
  if (attempt.finishedAt === null) return;
  if (!outbox.get().some((a) => a.id === attempt.id)) outbox.set([...outbox.get(), attempt]);
  await flushOutbox();
}
