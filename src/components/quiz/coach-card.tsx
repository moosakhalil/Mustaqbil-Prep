"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import type { CoachNote } from "@/lib/ai-focus";

type State = { kind: "checking" } | { kind: "idle" } | { kind: "making" } | { kind: "ready"; note: CoachNote } | { kind: "error"; message: string };

/** The AI coach for one finished military part: how it went and what to practise. A saved note is free; a new one uses one AI request. */
export function CoachCard({ attemptId, passed }: { attemptId: string; passed: boolean }) {
  const [state, setState] = useState<State>({ kind: "checking" });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ai/coach?attemptId=${encodeURIComponent(attemptId)}`)
      .then(async (res) => {
        if (cancelled) return;
        const data = res.ok ? ((await res.json()) as { note: CoachNote | null }) : null;
        if (data?.note) setState({ kind: "ready", note: data.note });
        else setState({ kind: "idle" });
      })
      .catch(() => !cancelled && setState({ kind: "idle" }));
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  async function make() {
    setState({ kind: "making" });
    try {
      const res = await fetch("/api/ai/coach", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ attemptId }) });
      const data = (await res.json().catch(() => ({}))) as { note?: CoachNote; error?: string };
      if (res.ok && data.note) setState({ kind: "ready", note: data.note });
      else if (res.status === 404) setState({ kind: "error", message: "This result is still being saved. Wait a moment, then try again." });
      else setState({ kind: "error", message: data.error ?? "The AI coach could not answer. Please try again." });
    } catch {
      setState({ kind: "error", message: "No connection. The coach needs the internet." });
    }
  }

  if (state.kind === "checking") return null;

  if (state.kind === "ready" && state.note) {
    const { note } = state;
    return (
      <section className="mt-4 rounded-card border border-line bg-surface p-4" aria-label="AI coach">
        <h2 className="flex items-center gap-2 font-extrabold"><Sparkles size={18} className="text-gold" aria-hidden /> AI coach</h2>
        <p className="mt-2 text-sm">{note.message}</p>
        {note.tips.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {note.tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm font-bold">Next: <span className="font-semibold">{note.next}</span></p>
        <p className="mt-2 text-xs text-soft">Made by AI from your numbers. It can make mistakes, so use it as a guide.</p>
      </section>
    );
  }

  return (
    <div className="mt-4">
      <button type="button" onClick={make} disabled={state.kind === "making"} className="flex h-12 w-full items-center justify-center gap-2 rounded-option border-2 border-gold/70 bg-gold/10 font-bold disabled:opacity-60">
        <Sparkles size={18} className="text-gold" aria-hidden />
        {state.kind === "making" ? "Thinking…" : passed ? "Ask the AI coach for next steps" : "Ask the AI coach what to practise"}
      </button>
      <p className="mt-1 text-center text-xs text-soft">Uses 1 of your 10 AI requests today.</p>
      {state.kind === "error" && <p role="alert" className="mt-2 text-center text-sm font-semibold text-bad">{state.message}</p>}
    </div>
  );
}
