"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

/** One tap on the result screen: how was this quiz? Goes to the same inbox as the Feedback screen (thumbs up = 5 stars, down = 1 star). */
export function QuizRating({ label }: { label: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function rate(good: boolean) {
    setState("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "quiz", rating: good ? 5 : 1, message: `Quiz: ${label}`.slice(0, 200) }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") return <p className="mt-6 text-center text-sm font-semibold text-ok" role="status">Thanks for rating this quiz.</p>;
  return (
    <section className="mt-6 text-center" aria-label="Rate this quiz">
      <p className="text-sm font-semibold">How was this quiz?</p>
      <div className="mt-2 flex justify-center gap-3">
        <button type="button" disabled={state === "sending"} onClick={() => rate(true)} aria-label="Good quiz" className="flex h-12 w-14 items-center justify-center rounded-option border border-line bg-surface disabled:opacity-60">
          <ThumbsUp size={22} className="text-ok" aria-hidden />
        </button>
        <button type="button" disabled={state === "sending"} onClick={() => rate(false)} aria-label="Poor quiz" className="flex h-12 w-14 items-center justify-center rounded-option border border-line bg-surface disabled:opacity-60">
          <ThumbsDown size={22} className="text-bad" aria-hidden />
        </button>
      </div>
      {state === "error" && <p role="alert" className="mt-2 text-xs font-semibold text-bad">Could not send. Try again later.</p>}
    </section>
  );
}
