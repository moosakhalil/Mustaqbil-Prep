"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Flag, LayoutGrid, X } from "lucide-react";
import { submitAttempt } from "@/lib/attempt-sync";
import { newId } from "@/lib/id";
import { manifest } from "@/lib/manifest";
import { loadPool } from "@/lib/question-loader";
import {
  answerQuestion, answeredCount, clearAnswer, createAttempt, currentQuestion, finishAttempt, goTo, isFinished, remainingMs, toggleFlag,
  type Attempt,
} from "@/lib/quiz/attempt-logic";
import { getAttempt, setAttempt, useAttempt } from "@/lib/quiz/attempt";
import { buildQuiz } from "@/lib/quiz/build";
import { usePlan } from "@/lib/quiz/settings";
import type { QuizPlan } from "@/lib/quiz/settings-logic";
import { useHydrated, useNow } from "@/lib/session-store";
import { LETTERS, OptionButton, type OptionState } from "./option-button";
import { ImageOptions, QuestionFigure } from "./image-options";
import { loadFresh } from "@/lib/fresh";
import { BookmarkButton, ExplainMore, ReportButton } from "./question-actions";
import { Sheet } from "./sheet";
import { courseTitle, unitTitle } from "./topic-bars";

const WARN_MS = 5 * 60_000;

function labelFor(plan: QuizPlan): string {
  const titles = Object.keys(plan.selection).map((id) => manifest.courses.find((c) => c.id === id)?.title ?? id);
  return titles.length <= 2 ? titles.join(" + ") : `${titles.length} courses`;
}

export function formatClock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}

/** Opens the quiz that was just set up (or the one in progress) and runs it. */
export function QuizRunner({ signedIn }: { signedIn: boolean }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const plan = usePlan();
  const attempt = useAttempt();
  const [error, setError] = useState("");
  const [tries, setTries] = useState(0);

  // A fresh plan (a new Start press) has no attempt yet: build the quiz from it
  const needsBuild = !!plan && (!attempt || attempt.planId !== plan.id);

  useEffect(() => {
    if (!hydrated || !plan || !needsBuild) return;
    let cancelled = false;
    (async () => {
      try {
        const [courses, fresh] = await Promise.all([loadPool(plan.selection, plan.weights), loadFresh()]);
        if (cancelled) return;
        const questions = buildQuiz({ total: plan.count, courses, duplicates: manifest.duplicates, fresh });
        if (questions.length === 0) throw new Error("No questions were found for those topics.");
        setError("");
        setAttempt(createAttempt({ id: newId(), planId: plan.id, label: labelFor(plan), mode: plan.mode, minutes: plan.minutes, questions, now: Date.now() }));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load the questions.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, plan, needsBuild, tries]);

  const done = !!attempt && !needsBuild && isFinished(attempt);
  useEffect(() => {
    if (done) router.replace("/quiz/result");
  }, [done, router]);

  if (!hydrated) return null;

  if (error) {
    return (
      <div className="pt-10 text-center">
        <p role="alert" className="font-semibold text-bad">{error}</p>
        <p className="mt-2 text-sm text-soft">Check your connection and try again.</p>
        <button type="button" onClick={() => { setError(""); setTries((n) => n + 1); }} className="mt-5 h-12 rounded-option bg-accent px-6 font-bold text-accent-ink">
          Try again
        </button>
      </div>
    );
  }

  if (attempt && !needsBuild && !isFinished(attempt)) return <Runner attempt={attempt} signedIn={signedIn} />;
  if (needsBuild || done) return <p className="pt-16 text-center text-soft" role="status">Preparing your quiz…</p>;

  return (
    <div className="pt-10 text-center">
      <p className="text-soft">No quiz has been set up yet.</p>
      <Link href="/practice" className="mt-5 inline-flex h-12 items-center rounded-option bg-accent px-6 font-bold text-accent-ink">
        Build your quiz
      </Link>
    </div>
  );
}

function act(fn: (a: Attempt, now: number) => Attempt) {
  const current = getAttempt();
  if (current) setAttempt(fn(current, Date.now()));
}

function Runner({ attempt, signedIn }: { attempt: Attempt; signedIn: boolean }) {
  const router = useRouter();
  const now = useNow(1000);
  const [confirming, setConfirming] = useState(false);
  const [palette, setPalette] = useState(false);

  const exam = attempt.mode === "exam";
  const q = currentQuestion(attempt);
  const n = attempt.questions.length;
  const picked = attempt.answers[q.id] ?? null;
  const remaining = remainingMs(attempt, now);
  const last = attempt.index === n - 1;

  const finish = useCallback(() => {
    act(finishAttempt);
    const finished = getAttempt();
    if (finished && signedIn) void submitAttempt(finished);
    router.replace("/quiz/result");
  }, [router, signedIn]);

  // the exam ends by itself when the time is up
  useEffect(() => {
    if (exam && now > 0 && remaining <= 0) finish();
  }, [exam, now, remaining, finish]);

  const optionState = (i: number): OptionState => {
    if (exam) return picked === i ? "selected" : "idle";
    if (picked === null) return "idle";
    if (i === q.answer) return "correct";
    return i === picked ? "wrong" : "idle";
  };

  const showFeedback = !exam && picked !== null;
  const next = () => (last ? setConfirming(true) : act((a, t) => goTo(a, a.index + 1, t)));

  return (
    <div className={showFeedback ? "pb-[55vh]" : "pb-28"}>
      <header className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => setConfirming(true)} aria-label="Finish quiz" className="flex h-12 w-12 items-center justify-center rounded-option border border-line bg-surface">
          <X size={20} aria-hidden />
        </button>
        <div className="text-center">
          {exam ? (
            <p
              className={`flex items-center justify-center gap-1.5 text-lg font-extrabold tabular-nums ${remaining <= WARN_MS ? "text-warn" : ""}`}
              role="timer"
              aria-label={`Time left ${formatClock(remaining)}`}
            >
              <Clock size={18} aria-hidden /> {now === 0 ? "--:--" : formatClock(remaining)}
              {remaining <= WARN_MS && <span className="text-xs font-bold">Hurry</span>}
            </p>
          ) : null}
          <p className="text-xs font-semibold text-soft">
            Question {attempt.index + 1} of {n}
          </p>
        </div>
        <BookmarkButton questionId={q.id} signedIn={signedIn} />
      </header>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full rounded-full bg-accent" style={{ width: `${((attempt.index + 1) / n) * 100}%` }} />
      </div>

      <p className="mt-6 text-xs font-semibold text-soft">
        {courseTitle(q.course)} · {unitTitle(q.course, q.unit)}
      </p>
      {q.q && <h1 className="mt-2 text-[18px] font-bold leading-snug">{q.q}</h1>}
      {q.img && (
        <div className="mt-3">
          <QuestionFigure src={q.img} label={`Question figure, question ${attempt.index + 1}`} />
        </div>
      )}

      {q.optionImages ? (
        <div className="mt-5">
          <ImageOptions key={q.id} q={q} answered={picked} reveal={!exam} onConfirm={(i) => act((a, t) => answerQuestion(a, q.id, i, t))} />
        </div>
      ) : (
        <div className="mt-5 space-y-3" role="group" aria-label="Answer options">
          {q.options.map((text, i) => (
            <OptionButton
              key={i}
              letter={LETTERS[i]}
              text={text}
              state={optionState(i)}
              disabled={!exam && picked !== null}
              onClick={() => (exam && picked === i ? act((a) => clearAnswer(a, q.id)) : act((a, t) => answerQuestion(a, q.id, i, t)))}
            />
          ))}
        </div>
      )}

      {exam && (
        <button
          type="button"
          onClick={() => act((a) => toggleFlag(a, q.id))}
          aria-pressed={attempt.flagged.includes(q.id)}
          className={`mt-5 flex min-h-12 items-center gap-2 rounded-option border px-4 text-sm font-semibold ${attempt.flagged.includes(q.id) ? "border-warn text-warn" : "border-line text-soft"}`}
        >
          <Flag size={16} aria-hidden /> {attempt.flagged.includes(q.id) ? "Flagged for review" : "Flag for review"}
        </button>
      )}

      {/* Bottom: in practice mode the written explanation slides up after an answer and never covers the options */}
      <div className="fixed inset-x-0 bottom-0 z-20">
        <div className="mx-auto max-w-md rounded-t-sheet border border-b-0 border-line bg-surface px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
          {showFeedback && (
            <div className="mb-4 max-h-[38vh] space-y-3 overflow-y-auto">
              <div role="status">
                <p className={`font-extrabold ${picked === q.answer ? "text-ok" : "text-bad"}`}>
                  {picked === q.answer ? "Correct" : `Not quite. The answer is ${LETTERS[q.answer]}.`}
                </p>
                <p className="mt-1 text-sm leading-relaxed">{q.explanation}</p>
              </div>
              {!q.optionImages && <ExplainMore key={q.id} questionId={q.id} signedIn={signedIn} />}
              <ReportButton key={`r-${q.id}`} questionId={q.id} signedIn={signedIn} />
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => act((a, t) => goTo(a, a.index - 1, t))}
              disabled={attempt.index === 0}
              aria-label="Previous question"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-option border border-line disabled:opacity-40"
            >
              <ChevronLeft size={20} aria-hidden />
            </button>
            {exam && (
              <button type="button" onClick={() => setPalette(true)} className="flex h-12 shrink-0 items-center gap-2 rounded-option border border-line px-4 text-sm font-semibold">
                <LayoutGrid size={18} aria-hidden /> {answeredCount(attempt)}/{n}
              </button>
            )}
            <button type="button" onClick={next} className="flex h-12 flex-1 items-center justify-center gap-1 rounded-option bg-accent font-bold text-accent-ink">
              {last ? "Finish quiz" : !exam && picked === null ? "Skip" : "Next"} {!last && <ChevronRight size={18} aria-hidden />}
            </button>
          </div>
        </div>
      </div>

      {palette && (
        <Sheet title="Questions" onClose={() => setPalette(false)}>
          <div className="mt-4 grid grid-cols-6 gap-2">
            {attempt.questions.map((x, i) => {
              const answered = attempt.answers[x.id] != null;
              const flagged = attempt.flagged.includes(x.id);
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => { act((a, t) => goTo(a, i, t)); setPalette(false); }}
                  aria-label={`Question ${i + 1}: ${answered ? "answered" : "not answered"}${flagged ? ", flagged" : ""}${i === attempt.index ? ", current" : ""}`}
                  className={`relative flex h-12 items-center justify-center rounded-option text-sm font-bold ${
                    answered ? "bg-accent text-accent-ink" : "bg-line/70 text-soft"
                  } ${i === attempt.index ? "ring-2 ring-text" : ""} ${flagged ? "outline-2 outline-offset-1 outline-warn" : ""}`}
                >
                  {i + 1}
                  {flagged && <Flag size={10} className="absolute right-1 top-1 text-warn" aria-hidden />}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-soft">Filled = answered · Flag = marked for review · Grey = not answered</p>
          <button type="button" onClick={() => { setPalette(false); setConfirming(true); }} className="mt-4 h-12 w-full rounded-option bg-accent font-bold text-accent-ink">
            Finish quiz
          </button>
        </Sheet>
      )}

      {confirming && (
        <Sheet title="Finish this quiz?" onClose={() => setConfirming(false)}>
          <p className="mt-3 text-soft">
            You answered {answeredCount(attempt)} of {n} questions
            {attempt.flagged.length > 0 ? ` and flagged ${attempt.flagged.length}` : ""}. Unanswered questions count as skipped.
          </p>
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => setConfirming(false)} className="h-12 flex-1 rounded-option border border-line font-bold">
              Keep going
            </button>
            <button type="button" onClick={finish} className="h-12 flex-1 rounded-option bg-accent font-bold text-accent-ink">
              Finish
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
