"use client";

import { useEffect } from "react";
import { AI_DAILY_LIMIT, aiLevel, untilReset } from "@/lib/ai-limit";
import { setAiLeft, useAiQuota } from "@/lib/ai-quota";

const bar = { ok: "bg-gold", low: "bg-warn", empty: "bg-bad" } as const;

/** Profile: how many AI requests are left today, as a number, a ten-segment bar and the time until the count resets. Starts from the server's number and then follows every AI use. */
export function AiUsageCard({ initialLeft }: { initialLeft: number }) {
  useEffect(() => {
    setAiLeft(initialLeft);
  }, [initialLeft]);
  const live = useAiQuota(true);
  const left = live?.left ?? initialLeft;
  const level = live?.level ?? aiLevel(initialLeft);
  const resetIn = live?.resetIn ?? untilReset(new Date());

  return (
    <section aria-label="AI helper" className="mt-4 rounded-card border border-line bg-surface p-4">
      <h2 className="text-xs font-bold uppercase tracking-wide text-soft">AI helper</h2>
      <p className="mt-2 text-sm" role="status">
        <b>{left} of {AI_DAILY_LIMIT}</b> requests left today.
      </p>
      <div className="mt-2 grid grid-cols-10 gap-1" aria-hidden>
        {Array.from({ length: AI_DAILY_LIMIT }, (_, i) => (
          <span key={i} className={`h-2.5 rounded-sm ${i < left ? bar[level] : "bg-line"}`} />
        ))}
      </div>
      <p className="mt-2 text-note text-soft">
        Resets at midnight, Pakistan time (in {resetIn}). Saved explanations are free.
      </p>
    </section>
  );
}
