"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { ArtBackdrop } from "@/components/home/picture-card";

/** The fifth card, ISSB: blurred and "coming soon", with a one-tap vote on whether the person wants it. The owner sees every vote with the email. */
export function IssbCard({ initialVote }: { initialVote: boolean | null }) {
  const [vote, setVote] = useState<boolean | null>(initialVote);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [changing, setChanging] = useState(false);

  async function cast(want: boolean) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/vote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ feature: "issb", want }) });
      if (!res.ok) throw new Error();
      setVote(want);
      setChanging(false);
    } catch {
      setError("Could not save your vote. Check your connection and try again.");
    }
    setBusy(false);
  }

  const asking = vote === null || changing;
  return (
    <section aria-label="ISSB, coming soon" className="relative overflow-hidden rounded-card border border-line text-white">
      <span aria-hidden className="absolute inset-0 scale-110 blur-md">
        <ArtBackdrop art="course-issb" tone="issb" />
      </span>
      <span aria-hidden className="absolute inset-0 bg-black/55" />
      <div className="relative flex flex-col gap-2 px-4 py-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/issb.webp" alt="" width={48} height={46} className="h-12 w-12 shrink-0 rounded-full bg-white object-contain p-1" />
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-extrabold leading-none">ISSB</p>
            <p className="mt-1 text-[13px] text-white/90">Inter Services Selection Board</p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-900">
            <Lock size={12} aria-hidden /> Soon
          </span>
        </div>

        {asking ? (
          <>
            <p className="text-sm font-bold">Want ISSB practice in the app?</p>
            <div className="flex gap-2">
              <button type="button" disabled={busy} onClick={() => cast(true)} className="h-12 flex-1 rounded-option bg-white px-3 text-sm font-extrabold text-slate-900 disabled:opacity-60">Yes, I want it</button>
              <button type="button" disabled={busy} onClick={() => cast(false)} className="h-12 flex-1 rounded-option border border-white/70 px-3 text-sm font-bold disabled:opacity-60">Not needed</button>
            </div>
          </>
        ) : (
          <p className="text-sm font-bold" role="status">
            Thank you! You voted: {vote ? "Yes, I want it" : "Not needed"}.{" "}
            <button type="button" onClick={() => setChanging(true)} className="inline-flex min-h-11 items-center px-1 underline">Change</button>
          </p>
        )}
        {error && <p role="alert" className="rounded-option bg-bad px-3 py-2 text-note font-bold text-white">{error}</p>}
      </div>
    </section>
  );
}
