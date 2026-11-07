"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, CircleSlash, FileUp, PartyPopper, Plus, RotateCcw, Sparkles, Target, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { flushOutbox } from "@/lib/attempt-sync";
import { newId } from "@/lib/id";
import { attemptResult, isFinished, retryAttempt, type Attempt } from "@/lib/quiz/attempt-logic";
import { setAttempt, useAttempt } from "@/lib/quiz/attempt";
import { continueMock, recordMockPart, useMock } from "@/lib/military-mock";
import { isMilitaryCourse, militaryTitle } from "@/lib/military";
import { PASS_MARK, passes } from "@/lib/military-rules";
import { setPlan } from "@/lib/quiz/settings";
import { useHydrated } from "@/lib/session-store";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { QuizRating } from "@/components/feedback/quiz-rating";
import { CoachCard } from "./coach-card";
import { PdfActions } from "./pdf-actions";
import { Bar, courseTitle, tone, weakestFirst } from "./topic-bars";

function Ring({ percent }: { percent: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const t = tone(percent);
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-line" />
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} className={`${t.text} stroke-current`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold tabular-nums">{percent}%</span>
        <span className={`text-note font-bold ${t.text}`}>{t.word}</span>
      </div>
    </div>
  );
}

/** A new practice quiz made only of the questions that were answered wrongly. */
function startRetry(source: Attempt, wrongIds: string[], go: () => void) {
  setPlan(null); // the retry is not built from a plan
  setAttempt(retryAttempt(source, wrongIds, { id: newId(), now: Date.now() }));
  go();
}

/** A short, kind line under the score. */
function friendlyLine(percent: number): string {
  if (percent >= 80) return "Great work!";
  if (percent >= 60) return "Good effort. You are getting there.";
  if (percent >= 40) return "Keep going. Every quiz helps.";
  return "A hard one. Try again, you can do it.";
}

const secondary = "flex h-12 items-center justify-center gap-2 rounded-option border border-line px-2 text-sm font-bold";

/** A grey outline of the result screen while the saved quiz loads. */
function ResultSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading your result">
      <Skeleton className="mx-auto h-12 w-40" />
      <div className="mt-6 flex items-center gap-4">
        <Skeleton className="h-32 w-32 shrink-0 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 rounded-card" />
        ))}
      </div>
      <Skeleton className="mt-6 h-14 w-full" />
    </div>
  );
}

const minutes = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} min ${Math.round(s % 60)} s` : `${Math.round(s)} s`);

/** The result of a finished quiz: the one on this phone, or a saved one passed in from the history. */
export function ResultView({ signedIn, attempt: given, reviewHref = "/quiz/review" }: { signedIn: boolean; attempt?: Attempt; reviewHref?: string }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const stored = useAttempt();
  const attempt = given ?? stored;
  const [showAll, setShowAll] = useState(false);

  const mock = useMock();
  const [moving, setMoving] = useState(false);

  // a signed-in person's finished quiz is saved to their progress; try again now in case it was waiting offline
  useEffect(() => {
    if (signedIn) void flushOutbox();
  }, [signedIn]);

  // a part of a full mock test remembers its score for the mock result
  useEffect(() => {
    if (attempt && isFinished(attempt)) recordMockPart(attempt);
  }, [attempt]);

  if (!hydrated) return <ResultSkeleton />;
  if (!attempt || !isFinished(attempt)) {
    return (
      <div className="pt-10 text-center">
        <p className="text-soft">No finished quiz to show yet.</p>
        <Link href="/practice" className="mt-5 inline-flex h-12 items-center rounded-option bg-accent px-6 font-bold text-accent-ink">
          Build your quiz
        </Link>
      </div>
    );
  }

  const { score, durationSec, avgSeconds } = attemptResult(attempt);
  const rows = weakestFirst(score);
  const shown = showAll ? rows : rows.slice(0, 6);
  const inMock = !!attempt.mockId && mock?.id === attempt.mockId && !mock.done;
  const lastPart = !!mock && mock.current >= mock.parts.length - 1;
  const missed = score.wrong + score.skipped;
  // the one button that helps most: the next mock part, the questions I missed, or the study plan after a clean sheet
  const primary: "mock" | "review" | "plan" | "new" = inMock ? "mock" : missed > 0 ? "review" : signedIn ? "plan" : "new";
  const extras: React.ReactNode[] = [];
  if (signedIn && primary !== "plan") {
    extras.push(
      <Link key="plan" href={`/plan/${attempt.id}`} className={secondary}>
        <Sparkles size={18} aria-hidden /> AI study plan
      </Link>,
    );
  }
  if (primary !== "review") {
    extras.push(
      <Link key="review" href={reviewHref} className={secondary}>
        Review answers
      </Link>,
    );
  }
  if (score.wrong > 0 && !inMock) {
    extras.push(
      <button key="retry" type="button" onClick={() => startRetry(attempt, score.wrongIds, () => router.push("/quiz"))} className={`${secondary} border-accent text-accent`}>
        <RotateCcw size={18} aria-hidden /> Retry wrong ({score.wrong})
      </button>,
    );
  }
  if (primary !== "new") {
    extras.push(
      <Link key="new" href="/practice" className={secondary}>
        <Plus size={18} aria-hidden /> New quiz
      </Link>,
    );
  }

  // where the back button goes: the history for a saved result, otherwise the screen the quiz came from
  const back = given
    ? { href: "/progress", label: "Progress" }
    : isMilitaryCourse(attempt.militaryCourse)
      ? { href: `/home/military/${attempt.militaryCourse}`, label: militaryTitle(attempt.militaryCourse) }
      : { href: "/home/academia", label: "Academia" };

  async function goOn() {
    setMoving(true);
    const next = await continueMock();
    router.push(next === "quiz" ? "/quiz" : next === "result" ? "/military/mock-result" : "/home/military");
  }

  return (
    <div>
      <div className="relative flex min-h-12 items-center justify-center">
        <Link href={back.href} aria-label={`Back to ${back.label}`} className="absolute left-0 flex h-12 w-12 items-center justify-center rounded-option border border-line bg-surface">
          <ChevronLeft size={22} aria-hidden />
        </Link>
        <h1 className="text-lg font-bold">Results</h1>
      </div>
      <p className="mt-1 text-center text-xs text-soft">{attempt.label} · {attempt.mode === "exam" ? "Exam" : "Practice"}</p>

      <div className="mt-6 flex items-center gap-4">
        <Ring percent={Math.round(score.percent)} />
        <div className="min-w-0">
          <p className="text-lg font-extrabold leading-snug">{friendlyLine(score.percent)}</p>
          <p className="mt-1 text-note text-soft">{minutes(durationSec)} in total</p>
          <p className="text-note text-soft">About {minutes(avgSeconds)} per question</p>
        </div>
      </div>

      {attempt.section && (
        passes(score.percent) ? (
          <div className="mt-4 rounded-card border-2 border-ok bg-ok/10 p-4 text-center" role="status">
            <PartyPopper size={30} className="mx-auto text-ok" aria-hidden />
            <p className="mt-1 text-lg font-extrabold text-ok">Congratulations!</p>
            <p className="mt-1 text-sm font-bold">You passed this part. Pass line {PASS_MARK}%.</p>
          </div>
        ) : (
          <div className="mt-4 rounded-card border-2 border-bad bg-bad/10 p-4 text-center" role="status">
            <Target size={30} className="mx-auto text-bad" aria-hidden />
            <p className="mt-1 text-lg font-extrabold text-bad">Keep trying</p>
            <p className="mt-1 text-sm font-bold">
              {Math.round((PASS_MARK - score.percent) * 10) / 10} points below the {PASS_MARK}% pass line. Practise and try again, you can get there.
            </p>
            {isMilitaryCourse(attempt.militaryCourse) && (
              <Link href={`/military/${attempt.militaryCourse}/${attempt.section}`} className="mt-3 inline-flex h-11 items-center rounded-option bg-bad px-5 text-sm font-bold text-bg">
                Practise this part again
              </Link>
            )}
          </div>
        )
      )}

      {attempt.section && signedIn && <CoachCard attemptId={attempt.id} passed={passes(score.percent)} />}

      <ul className="mt-6 grid grid-cols-3 gap-3 text-center" aria-label="Counts">
        <li className="rounded-card bg-ok/10 p-3">
          <Check size={18} className="mx-auto text-ok" aria-hidden />
          <p className="mt-1 text-xl font-extrabold tabular-nums">{score.correct}</p>
          <p className="text-note font-semibold text-ok">Correct</p>
        </li>
        <li className="rounded-card bg-bad/10 p-3">
          <X size={18} className="mx-auto text-bad" aria-hidden />
          <p className="mt-1 text-xl font-extrabold tabular-nums">{score.wrong}</p>
          <p className="text-note font-semibold text-bad">Wrong</p>
        </li>
        <li className="rounded-card bg-line/60 p-3">
          <CircleSlash size={18} className="mx-auto text-soft" aria-hidden />
          <p className="mt-1 text-xl font-extrabold tabular-nums">{score.skipped}</p>
          <p className="text-note font-semibold text-soft">Skipped</p>
        </li>
      </ul>

      {Object.keys(score.byCourse).length > 1 && (
        <section className="mt-8">
          <h2 className="font-extrabold">By course</h2>
          <ul className="mt-3 space-y-4">
            {Object.entries(score.byCourse).map(([id, tally]) => (
              <Bar key={id} label={courseTitle(id)} tally={tally} />
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-extrabold">By chapter</h2>
        <p className="text-xs text-soft">Weakest first</p>
        <ul className="mt-3 space-y-4">
          {shown.map((r) => (
            <Bar key={r.key} label={r.label} tally={r.tally} />
          ))}
        </ul>
        {rows.length > 6 && (
          <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-3 min-h-12 text-sm font-bold text-accent">
            {showAll ? "Show fewer" : `Show all ${rows.length} chapters`}
          </button>
        )}
      </section>

      <div className="mt-8 space-y-3">
        {primary === "mock" && (
          <button type="button" onClick={goOn} disabled={moving} className="flex h-14 w-full items-center justify-center rounded-option bg-military font-bold text-bg disabled:opacity-60">
            {moving ? "Loading…" : lastPart ? "See the mock test result" : "Continue to the next part"}
          </button>
        )}
        {primary === "review" && (
          <Link href={reviewHref} className="flex h-14 w-full items-center justify-center gap-1 rounded-option bg-accent font-bold text-accent-ink">
            Review the {missed} I missed <ChevronRight size={18} aria-hidden />
          </Link>
        )}
        {primary === "plan" && (
          <Link href={`/plan/${attempt.id}`} className="flex h-14 w-full items-center justify-center gap-2 rounded-option bg-accent font-bold text-accent-ink">
            <Sparkles size={18} aria-hidden /> Get my AI study plan
          </Link>
        )}
        {primary === "new" && (
          <Link href="/practice" className="flex h-14 w-full items-center justify-center gap-2 rounded-option bg-accent font-bold text-accent-ink">
            <Plus size={18} aria-hidden /> Build another quiz
          </Link>
        )}
        <div className="grid grid-cols-2 gap-3">
          {extras.map((node, i) => (
            <div key={i} className={`flex flex-col ${i === extras.length - 1 && extras.length % 2 === 1 ? "col-span-2" : ""}`}>
              {node}
            </div>
          ))}
        </div>
        <PdfActions attempt={attempt} />
      </div>
      {signedIn && <QuizRating label={attempt.label} />}
      {signedIn && (
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
      )}
      <InstallPrompt />
      {!signedIn && (
        <p className="mt-4 text-center text-note text-soft">
          You are a guest, so this result is not saved and the AI study plan is not available. <Link href="/sign-in" className="font-semibold text-accent">Sign in</Link> to keep your progress.
        </p>
      )}
    </div>
  );
}
