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
    <section aria-label="ISSB, coming soon" className="relative flex min-h-[200px] overflow-hidden rounded-card border border-line text-white sm:aspect-[16/9]">
      <span aria-hidden className="absolute inset-0 scale-110 blur-md">
        <ArtBackdrop art="course-issb" tone="issb" />
      </span>
      <span aria-hidden className="absolute inset-0 bg-black/55" />
      <div className="relative flex w-full flex-col items-center justify-center gap-1.5 px-4 py-5 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/issb.webp" alt="" width={56} height={54} className="h-14 w-14 rounded-full bg-white object-contain p-1" />
        <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-900">
          <Lock size={12} aria-hidden /> Coming soon
        </span>
        <p className="text-3xl font-extrabold leading-none">ISSB</p>
        <p className="text-xs text-white/90">Inter Services Selection Board practice</p>

        {asking ? (
          <>
            <p className="mt-1 text-sm font-bold">Do you want ISSB practice in the app?</p>
            <div className="flex w-full max-w-xs flex-wrap justify-center gap-2">
              <button type="button" disabled={busy} onClick={() => cast(true)} className="h-11 flex-1 whitespace-nowrap rounded-option bg-white px-4 text-sm font-extrabold text-slate-900 disabled:opacity-60">Yes, I want it</button>
              <button type="button" disabled={busy} onClick={() => cast(false)} className="h-11 flex-1 whitespace-nowrap rounded-option border border-white/70 px-4 text-sm font-bold disabled:opacity-60">Not needed</button>
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm font-bold" role="status">
            Thank you! You voted: {vote ? "Yes, I want it" : "Not needed"}.{" "}
            <button type="button" onClick={() => setChanging(true)} className="underline">Change</button>
          </p>
        )}
        {error && <p role="alert" className="rounded-full bg-bad px-3 py-1 text-xs font-bold text-white">{error}</p>}
      </div>
    </section>
  );
}
