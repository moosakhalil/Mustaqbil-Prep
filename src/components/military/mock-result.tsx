"use client";

import Link from "next/link";
import { PartyPopper, Target } from "lucide-react";
import { CoachCard } from "@/components/quiz/coach-card";
import { SECTIONS, militaryTitle } from "@/lib/military";
import { useMock } from "@/lib/military-mock";
import { PASS_MARK, evaluateMock } from "@/lib/military-rules";
import { useHydrated } from "@/lib/session-store";

/** The result of a full mock test: a score and Pass or Fail for each part, and whether the candidate would go on to the next round. */
export function MockResult({ signedIn }: { signedIn: boolean }) {
  const hydrated = useHydrated();
  const mock = useMock();
  if (!hydrated) return null;
  if (!mock) {
    return (
      <div className="pt-10 text-center">
        <p className="text-soft">No mock test result to show yet.</p>
        <Link href="/home/military" className="mt-5 inline-flex h-12 items-center rounded-option bg-accent px-6 font-bold text-accent-ink">Military</Link>
      </div>
    );
  }

  const ev = evaluateMock(Object.fromEntries(mock.parts.map((p) => [p.section, p.percent])));
  const title = (id: string) => SECTIONS.find((s) => s.id === id)!.title;
  // the AI coach talks about the weakest part (or the lowest score when all passed)
  const coachPart = [...mock.parts].filter((p) => p.percent !== null).sort((x, y) => (x.percent ?? 0) - (y.percent ?? 0))[0];

  return (
    <div>
      <h1 className="text-center text-lg font-bold">Mock test result</h1>
      <p className="mt-1 text-center text-xs text-soft">{militaryTitle(mock.course)}</p>

      <div className={`mt-6 rounded-card border-2 p-5 text-center ${ev.eligible ? "border-ok bg-ok/10" : "border-bad bg-bad/10"}`} role="status">
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
        {!ev.eligible && (ev.failed[0] ?? ev.missing[0]) && (
          <Link href={`/military/${mock.course}/${ev.failed[0] ?? ev.missing[0]}`} className="mt-3 inline-flex h-11 items-center rounded-option bg-bad px-5 text-sm font-bold text-bg">
            Practise {title((ev.failed[0] ?? ev.missing[0])!)}
          </Link>
        )}
      </div>

      {signedIn && coachPart?.attemptId && <CoachCard attemptId={coachPart.attemptId} passed={ev.eligible} />}

      <ul className="mt-5 space-y-3" aria-label="Parts">
        {ev.parts.map((p) => {
          const part = mock.parts.find((x) => x.section === p.section)!;
          return (
            <li key={p.section} className="rounded-card border border-line bg-surface p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-bold">{title(p.section)}</span>
                <span className={`text-sm font-extrabold ${p.pass === null ? "text-soft" : p.pass ? "text-ok" : "text-bad"}`}>
                  {p.percent === null ? "Not taken" : `${Math.round(p.percent)}% · ${p.pass ? "Pass" : "Fail"}`}
                </span>
              </div>
              {p.percent !== null && (
                <>
                  <div className="relative mt-2 h-2 rounded-full bg-line" aria-hidden>
                    <div className={`h-full rounded-full ${p.pass ? "bg-ok" : "bg-bad"}`} style={{ width: `${p.percent}%` }} />
                    <div className="absolute inset-y-[-3px] w-0.5 bg-text" style={{ left: `${PASS_MARK}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-soft">
                    {part.correct}/{part.total} correct · pass line {PASS_MARK}%{p.shortBy > 0 ? ` · ${p.shortBy} points short` : ""}
                  </p>
                </>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-8 space-y-3">
        <Link href={`/military/${mock.course}/mock`} className="flex h-12 w-full items-center justify-center rounded-option bg-accent font-bold text-accent-ink">Try another mock test</Link>
        <Link href={`/home/military/${mock.course}`} className="flex h-12 w-full items-center justify-center rounded-option border border-line font-bold">Back to Military</Link>
      </div>
    </div>
  );
}
