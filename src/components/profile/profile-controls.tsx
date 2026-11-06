"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Download } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { MILITARY_COURSES } from "@/lib/military";
import { setTheme, useTheme, type Theme } from "@/lib/theme";
import { Sheet } from "@/components/quiz/sheet";

const chip = (on: boolean) => `h-10 flex-1 rounded-full px-4 text-sm font-semibold ${on ? "bg-accent/20 text-accent ring-1 ring-accent" : "bg-line/60 text-soft"}`;

/** Light, Dark or System. The choice applies at once. */
export function ThemeSwitcher() {
  const theme = useTheme();
  return (
    <div className="flex gap-2" role="group" aria-label="Appearance">
      {(["light", "dark", "system"] as Theme[]).map((t) => (
        <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(t)} className={`${chip(theme === t)} capitalize`}>
          {t}
        </button>
      ))}
    </div>
  );
}

/** The military course a candidate prepares for. Home opens on it. */
export function PreferredCourse({ initial }: { initial: string | null }) {
  const [value, setValue] = useState<string | null>(initial);
  const [error, setError] = useState("");

  async function pick(id: string | null) {
    const before = value;
    setValue(id);
    setError("");
    try {
      const res = await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ preferredCourse: id }) });
      if (!res.ok) throw new Error();
    } catch {
      setValue(before);
      setError("Could not save. Check your connection and try again.");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Preferred military course">
        {MILITARY_COURSES.map((c) => (
          <button key={c.id} type="button" aria-pressed={value === c.id} onClick={() => pick(value === c.id ? null : c.id)} className={`${chip(value === c.id)} flex-none`}>
            {c.title}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-bad">{error}</p>}
    </div>
  );
}

/** "Fresh questions first": new quizzes take questions you have not seen yet and bring back about 1 in 5 you got wrong. */
export function FreshSwitch({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [error, setError] = useState("");

  async function flip() {
    const next = !on;
    setOn(next);
    setError("");
    try {
      const res = await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ freshFirst: next }) });
      if (!res.ok) throw new Error();
    } catch {
      setOn(!next);
      setError("Could not save. Check your connection and try again.");
    }
  }

  return (
    <div>
      <button type="button" role="switch" aria-checked={on} onClick={flip} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-option border border-line bg-surface px-4 py-2 text-left">
        <span className="font-bold">Fresh questions first</span>
        <span aria-hidden className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors ${on ? "bg-accent" : "bg-line"}`}>
          <span className={`h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`} />
        </span>
      </button>
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-bad">{error}</p>}
    </div>
  );
}

/** The day of the real test. Home counts the days left and the AI suggestion fits its advice to it. */
export function ExamDate({ initial }: { initial: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? "");
  const [saved, setSaved] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  async function save(next: string | null) {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ examDate: next }) });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not save");
      setSaved(next ?? "");
      if (!next) setValue("");
      setMessage(next ? "Saved." : "Cleared.");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save. Check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <input type="date" aria-label="Test date" min={today} value={value} onChange={(e) => setValue(e.target.value)} className="h-12 flex-1 rounded-option border border-line bg-surface px-3 outline-none focus:border-accent" />
        <button type="button" disabled={busy || !value || value === saved} onClick={() => save(value)} className="h-12 rounded-option bg-accent px-5 font-bold text-accent-ink disabled:opacity-50">Save</button>
        {saved && <button type="button" disabled={busy} onClick={() => save(null)} className="h-12 rounded-option border border-line px-4 font-bold disabled:opacity-50">Clear</button>}
      </div>
      {message && <p role="status" className="mt-2 text-sm font-semibold">{message}</p>}
    </div>
  );
}

export function ExportData() {
  return (
    <a href="/api/account/export" download className="flex h-12 items-center justify-center gap-2 rounded-option border border-line font-bold">
      <Download size={18} aria-hidden /> Export my data
    </a>
  );
}

export function SignOut() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        router.replace("/sign-in");
        router.refresh();
      }}
      className="h-12 w-full rounded-option border border-line bg-surface font-bold"
    >
      Sign out
    </button>
  );
}

export function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirm: "DELETE" }) });
      if (!res.ok) throw new Error();
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // storage blocked: nothing to clear
      }
      router.replace("/sign-in");
      router.refresh();
    } catch {
      setError("Could not delete the account. Please try again.");
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="h-12 w-full rounded-option border border-bad font-bold text-bad">
        Delete my account
      </button>
      {open && (
        <Sheet title="Delete your account?" onClose={() => setOpen(false)}>
          <p className="mt-3 text-sm text-soft">
            This removes your sign-in, results, wrong-answer notebook, bookmarks and reports for good. It cannot be undone. Export your data first if you want a copy.
          </p>
          <label className="mt-4 block text-sm font-semibold">
            Type DELETE to confirm
            <input value={text} onChange={(e) => setText(e.target.value)} className="mt-2 h-12 w-full rounded-option border border-line bg-bg px-3 outline-none focus:border-bad" />
          </label>
          {error && <p role="alert" className="mt-2 text-sm font-semibold text-bad">{error}</p>}
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => setOpen(false)} className="h-12 flex-1 rounded-option border border-line font-bold">Cancel</button>
            <button type="button" onClick={remove} disabled={text !== "DELETE" || busy} className="h-12 flex-1 rounded-option bg-bad font-bold text-bg disabled:opacity-50">
              {busy ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}

/** True while the phone is online. The server and the first draw on the phone both say online, so they match; it then follows the real state. */
function useOnline(): boolean {
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

/** Save every question bank on the phone so quizzes work without internet (the service worker keeps what is fetched). */
export function OfflineSave() {
  const [state, setState] = useState<{ done: number; total: number; status: "idle" | "working" | "done" | "error" }>({ done: 0, total: 0, status: "idle" });
  const online = useOnline();

  async function save() {
    const [{ manifest }, { militaryManifest }] = await Promise.all([import("@/lib/manifest"), import("@/lib/military-data")]);
    const urls = [...manifest.courses.map((c) => `/data/${c.file}`), ...militaryManifest.banks.map((b) => `/data/${b.file}`)];
    setState({ done: 0, total: urls.length, status: "working" });
    let done = 0;
    try {
      for (const url of urls) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(url);
        await res.arrayBuffer();
        setState({ done: ++done, total: urls.length, status: "working" });
      }
      setState({ done, total: urls.length, status: "done" });
    } catch {
      setState({ done, total: urls.length, status: "error" });
    }
  }

  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <p className="text-sm text-soft">Quizzes work offline for courses you have used. Save all questions (about 9 MB, best on Wi-Fi) so every course works without internet.</p>
      <button type="button" onClick={save} disabled={state.status === "working" || !online} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-option border border-line font-bold disabled:opacity-60">
        <Download size={18} aria-hidden />
        {state.status === "working" ? `Saving ${state.done} of ${state.total}…` : state.status === "done" ? "Saved. Save again to refresh" : "Save all questions for offline"}
      </button>
      {state.status === "error" && <p role="alert" className="mt-2 text-sm font-semibold text-bad">Could not save everything. Check your connection and try again.</p>}
      {!online && <p className="mt-2 text-xs text-soft">You are offline right now.</p>}
    </div>
  );
}
