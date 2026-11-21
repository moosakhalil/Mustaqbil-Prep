"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AiLeftChip } from "@/components/ui/ai-left-chip";
import { setAiLeft, useAiQuota } from "@/lib/ai-quota";

type Mode = "simpler" | "example" | "quiz";
const MODES: { id: Mode; label: string; heading: string }[] = [
  { id: "simpler", label: "Simpler", heading: "The trick, simpler" },
  { id: "example", label: "Another example", heading: "Another example" },
  { id: "quiz", label: "Quiz me", heading: "Quiz me" },
];

type State = { kind: "idle" } | { kind: "loading"; mode: Mode } | { kind: "done"; mode: Mode; text: string } | { kind: "error"; message: string };

/** The AI helper under a lesson: the trick in simpler words, one more worked example, or three practice questions. It works from the lesson's own text. */
export function LessonAi({ lessonKey }: { lessonKey: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const quota = useAiQuota(true);
  const usedUp = quota?.level === "empty";
  const loading = state.kind === "loading";

  async function ask(mode: Mode) {
    setState({ kind: "loading", mode });
    try {
      const res = await fetch("/api/ai/guide", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lessonKey, mode }) });
      const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string; left?: number };
      setAiLeft(data.left);
      if (res.ok && data.text) setState({ kind: "done", mode, text: data.text });
      else setState({ kind: "error", message: data.error ?? "The AI helper could not answer. Please try again." });
    } catch {
      setState({ kind: "error", message: "No connection. The AI helper needs the internet." });
    }
  }

  return (
    <section aria-label="AI helper" className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-lg font-extrabold text-accent">
          <Sparkles size={18} aria-hidden /> AI helper
        </h2>
        {quota && <AiLeftChip quota={quota} size="md" />}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => void ask(m.id)}
            disabled={loading}
            className="min-h-12 rounded-full border border-accent/40 bg-accent/10 px-4 text-[15px] font-bold text-accent disabled:opacity-60"
          >
            {loading && state.mode === m.id ? "Thinking…" : m.label}
          </button>
        ))}
      </div>
      {usedUp && <p className="mt-2 text-[15px] text-soft">The saved &quot;Simpler&quot; notes still open. New examples and quizzes need tomorrow&apos;s requests (in {quota?.resetIn}).</p>}
      {state.kind === "error" && <p role="alert" className="mt-3 text-[15px] font-semibold text-bad">{state.message}</p>}
      {state.kind === "done" && (
        <div className="mt-3 rounded-card border border-accent/40 bg-accent/10 p-3.5" role="status">
          <p className="text-[15px] font-bold text-accent">{MODES.find((m) => m.id === state.mode)?.heading}</p>
          <p className="mt-1 whitespace-pre-wrap text-base leading-relaxed">{state.text}</p>
          <p className="mt-2 text-sm text-soft">AI can make mistakes. Check it against the lesson above.</p>
        </div>
      )}
    </section>
  );
}
