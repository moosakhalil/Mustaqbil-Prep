"use client";

import Link from "next/link";
import { useState } from "react";
import { Bookmark, Flag, Sparkles } from "lucide-react";
import { toggleBookmark, useBookmarks } from "@/lib/bookmarks";
import { Sheet } from "./sheet";

/** Bookmark toggle. Only for signed-in people (guests have nowhere to save it). */
export function BookmarkButton({ questionId, signedIn }: { questionId: string; signedIn: boolean }) {
  const marks = useBookmarks(signedIn);
  if (!signedIn) return <div className="h-12 w-12" aria-hidden />;
  const on = marks?.has(questionId) ?? false;
  return (
    <button
      type="button"
      onClick={() => void toggleBookmark(questionId)}
      aria-pressed={on}
      aria-label={on ? "Remove bookmark" : "Bookmark this question"}
      className="flex h-12 w-12 items-center justify-center rounded-option border border-line bg-surface"
    >
      <Bookmark size={20} className={on ? "fill-accent text-accent" : "text-soft"} aria-hidden />
    </button>
  );
}

type AiState = { kind: "idle" } | { kind: "loading" } | { kind: "done"; text: string } | { kind: "error"; message: string };

/** "Explain more": a clearer explanation from the AI helper. Saved explanations are free; new ones use one of the 10 a day. */
export function ExplainMore({ questionId, signedIn }: { questionId: string; signedIn: boolean }) {
  const [state, setState] = useState<AiState>({ kind: "idle" });

  if (!signedIn) {
    return (
      <p className="text-xs text-soft">
        <Link href="/sign-in" className="font-semibold text-accent">Sign in</Link> to use the AI helper.
      </p>
    );
  }

  async function ask() {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/ai/explain", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ questionId }) });
      const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
      if (res.ok && data.text) setState({ kind: "done", text: data.text });
      else setState({ kind: "error", message: data.error ?? "The AI helper could not answer. Please try again." });
    } catch {
      setState({ kind: "error", message: "No connection. The AI helper needs the internet." });
    }
  }

  return (
    <div>
      {state.kind !== "done" && (
        <button
          type="button"
          onClick={ask}
          disabled={state.kind === "loading"}
          className="flex min-h-10 items-center gap-2 rounded-full bg-accent/15 px-4 text-sm font-bold text-accent disabled:opacity-60"
        >
          <Sparkles size={16} aria-hidden /> {state.kind === "loading" ? "Thinking…" : "Explain more"}
        </button>
      )}
      {state.kind === "error" && (
        <p role="alert" className="mt-2 text-sm font-semibold text-bad">
          {state.message}
        </p>
      )}
      {state.kind === "done" && (
        <div className="rounded-card border border-accent/40 bg-accent/10 p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-accent">
            <Sparkles size={14} aria-hidden /> AI explanation
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{state.text}</p>
          <p className="mt-2 text-xs text-soft">AI can make mistakes. The written explanation above comes from the question bank.</p>
        </div>
      )}
    </div>
  );
}

/** "Report this question": a wrong answer key, a typo or an unclear question. */
export function ReportButton({ questionId, signedIn }: { questionId: string; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!signedIn) return null;

  async function send() {
    setStatus("sending");
    try {
      const res = await fetch("/api/reports", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ questionId, reason }) });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) setStatus("sent");
      else {
        setMessage(data.error ?? "Could not send the report.");
        setStatus("error");
      }
    } catch {
      setMessage("No connection. Try again when you are online.");
      setStatus("error");
    }
  }

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setStatus("idle"); }} className="flex min-h-10 items-center gap-1.5 text-xs font-semibold text-soft">
        <Flag size={14} aria-hidden /> Report this question
      </button>
      {open && (
        <Sheet title="Report this question" onClose={() => setOpen(false)}>
          {status === "sent" ? (
            <>
              <p className="mt-3 text-ok font-semibold">Thank you. The report was sent.</p>
              <button type="button" onClick={() => setOpen(false)} className="mt-4 h-12 w-full rounded-option bg-accent font-bold text-accent-ink">Close</button>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-soft">What is wrong? For example: the marked answer is incorrect, a typo, or the question is unclear.</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={4}
                aria-label="What is wrong with this question"
                className="mt-3 w-full rounded-option border border-line bg-bg p-3 outline-none focus:border-accent"
              />
              {status === "error" && <p role="alert" className="mt-2 text-sm font-semibold text-bad">{message}</p>}
              <button
                type="button"
                onClick={send}
                disabled={reason.trim().length < 3 || status === "sending"}
                className="mt-4 h-12 w-full rounded-option bg-accent font-bold text-accent-ink disabled:opacity-50"
              >
                {status === "sending" ? "Sending…" : "Send report"}
              </button>
            </>
          )}
        </Sheet>
      )}
    </>
  );
}
