"use client";

import Link from "next/link";
import { Check, ChevronRight, FileUp, PartyPopper, Target, X } from "lucide-react";
import { BackTitle } from "@/components/military/back-title";
import { Skeleton } from "@/components/ui/skeleton";
import { CoachCard } from "@/components/quiz/coach-card";
import { SECTIONS, militaryTitle } from "@/lib/military";
import { useMock } from "@/lib/military-mock";
import { PASS_MARK, evaluateMock } from "@/lib/military-rules";
import { useHydrated } from "@/lib/session-store";

/** The result of a full mock test: a score and Pass or Fail for each part, and whether the candidate would go on to the next round. */
export function MockResult({ signedIn }: { signedIn: boolean }) {
  const hydrated = useHydrated();
  const mock = useMock();
  if (!hydrated) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading your result" className="space-y-4">
        <BackTitle href="/home/military" label="Military" title="Mock test result" />
        <Skeleton className="h-44 rounded-card" />
        <Skeleton className="h-12" />
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
      </div>
    );
  }
  if (!mock) {
    return (
      <div className="pt-10 text-center">
        <p className="text-soft">No mock test result to show yet.</p>
        <Link href="/home/military" className="mt-5 inline-flex h-12 items-center rounded-option bg-accent px-6 font-bold text-accent-ink">Back to Military</Link>
      </div>
    );
  }

  const ev = evaluateMock(Object.fromEntries(mock.parts.map((p) => [p.section, p.percent])));
  const title = (id: string) => SECTIONS.find((s) => s.id === id)!.title;
  // the AI coach talks about the weakest part (or the lowest score when all passed)
  const practiseId = ev.failed[0] ?? ev.missing[0];
  const coachPart = [...mock.parts].filter((p) => p.percent !== null).sort((x, y) => (x.percent ?? 0) - (y.percent ?? 0))[0];

  return (
    <div>
      <BackTitle href={`/home/military/${mock.course}`} label={militaryTitle(mock.course)} title="Mock test result" />

      <div className={`mt-4 rounded-card border-2 p-5 text-center ${ev.eligible ? "border-ok bg-ok/10" : "border-bad bg-bad/10"}`} role="status">
        {ev.eligible ? <PartyPopper size={34} className="mx-auto text-ok" aria-hidden /> : <Target size={34} className="mx-auto text-bad" aria-hidden />}
        <p className={`mt-2 text-xl font-extrabold ${ev.eligible ? "text-ok" : "text-bad"}`}>{ev.eligible ? "Congratulations!" : "Keep trying"}</p>
        <p className={`mt-1 font-bold ${ev.eligible ? "text-ok" : "text-bad"}`}>{ev.eligible ? "Eligible for the next round" : "Not eligible for the next round yet"}</p>
        <p className="mt-1 text-sm">
          {ev.eligible
            ? `You scored ${PASS_MARK}% or more in all three parts. Well done.`
            : ev.missing.length > 0
              ? `Not every part was taken (missing: ${ev.missing.map(title).join(", ")}).`
              : `Below ${PASS_MARK}% in: ${ev.failed.map(title).join(", ")}. All three parts must reach ${PASS_MARK}%. Practise and try again, you can get there.`}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-[1.4fr_1fr] gap-2">
        {!ev.eligible && practiseId ? (
          <Link href={`/military/${mock.course}/${practiseId}`} className="flex h-12 items-center justify-center gap-1 rounded-option bg-accent px-2 text-sm font-bold text-accent-ink">
            Practise {title(practiseId)} <ChevronRight size={16} aria-hidden />
          </Link>
        ) : (
          <Link href={`/home/military/${mock.course}`} className="flex h-12 items-center justify-center rounded-option bg-accent px-2 text-sm font-bold text-accent-ink">Back to {militaryTitle(mock.course)}</Link>
        )}
        <Link href={`/military/${mock.course}/mock`} className="flex h-12 items-center justify-center rounded-option border border-line px-2 text-sm font-bold">Try again</Link>
      </div>

      {signedIn && coachPart?.attemptId && <CoachCard attemptId={coachPart.attemptId} passed={ev.eligible} />}

      <ul className="mt-5 space-y-3" aria-label="Parts">
        {ev.parts.map((p) => {
          const part = mock.parts.find((x) => x.section === p.section)!;
          return (
            <li key={p.section} className="rounded-card border border-line bg-surface p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-bold">{title(p.section)}</span>
                <span className={`flex items-center gap-1 text-note font-extrabold ${p.pass === null ? "text-soft" : p.pass ? "text-ok" : "text-bad"}`}>
                  {p.percent === null ? "Not taken" : (
                    <>
                      {Math.round(p.percent)}% · {p.pass ? <Check size={14} aria-hidden /> : <X size={14} aria-hidden />} {p.pass ? "Pass" : "Fail"}
                    </>
                  )}
                </span>
              </div>
              {p.percent !== null && (
                <>
                  <div className="relative mt-7 h-2.5 rounded-full bg-line" role="img" aria-label={`${Math.round(p.percent)}%. The pass line is ${PASS_MARK}%.`}>
                    <div className={`h-full rounded-full ${p.pass ? "bg-ok" : "bg-bad"}`} style={{ width: `${p.percent}%` }} />
                    <div className="absolute -inset-y-1 w-0.5 bg-text" style={{ left: `${PASS_MARK}%` }} />
                    <span aria-hidden className="absolute -top-6 -translate-x-1/2 whitespace-nowrap text-xs font-extrabold" style={{ left: `${PASS_MARK}%` }}>{PASS_MARK}% pass</span>
                  </div>
                  <p className="mt-2 text-note text-soft">
                    {part.correct} of {part.total} correct · pass line {PASS_MARK}%{p.shortBy > 0 ? ` · ${p.shortBy} points short` : ""}
                  </p>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <section aria-label="Send study material" className="mt-4 flex items-center gap-3 rounded-card border border-line bg-surface p-4">
        <FileUp size={22} className="shrink-0 text-accent" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-bold">Know a better source?</p>
          <p className="text-note text-soft">Send past papers or notes to the owner.</p>
        </div>
        <Link href="/feedback?kind=material" className="flex h-11 shrink-0 items-center rounded-option border border-line px-4 text-sm font-bold text-accent">
          Send
        </Link>
      </section>
    </div>
  );
}
