import type { Fresh, SeenMap } from "./fresh-logic";

// Loads what "fresh questions first" needs from the server just before a quiz is built.
// The last answer is kept on the phone, so a quiz can still start (with the old information) when the connection is down.

const KEY = "mp.fresh.v1";
type Stored = { enabled: boolean; seen: SeenMap; wrong: string[] };

function read(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

/** The person's seen questions and wrong notebook, or null when the switch is off, they are offline with nothing saved, or the answer is unusable. */
export async function loadFresh(): Promise<Fresh | null> {
  let data: Stored | null = null;
  try {
    const res = await fetch("/api/seen", { signal: AbortSignal.timeout(4_000) });
    if (res.ok) {
      data = (await res.json()) as Stored;
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch {
        // storage full or blocked: the quiz just uses this answer once
      }
    }
  } catch {
    data = read();
  }
  if (!data || !data.enabled || typeof data.seen !== "object") return null;
  return { seen: data.seen, wrong: new Set(Array.isArray(data.wrong) ? data.wrong : []) };
}
