"use client";

import Link from "next/link";
import { useState } from "react";
import { Lightbulb, Sparkles, X } from "lucide-react";
import { ExplainMore } from "@/components/quiz/question-actions";
import { Sheet } from "@/components/quiz/sheet";
import { StepList } from "@/components/guide/step-list";
import { lessonHref, lessonsForQuestion, trickSteps } from "@/lib/guide";
import type { QuizQuestion } from "@/lib/quiz/build";
import { createBrowserStore, useHydrated } from "@/lib/session-store";

// The first time a student sees the bulb, a small tip points at it and a dot sits on it. Opening the bulb or tapping "Got it" turns both off for good on this phone.
const seenStore = createBrowserStore<boolean>("mp.guide.bulb.v1", false, (raw) => raw === true, "local");

type Tab = "trick" | "ai";

/**
 * The bulb in the quiz header (practice quizzes only): it opens the trick for this question's topic. It gives a hint, never the answer.
 * Renders nothing when no lesson covers the question. Put it in a `relative` box: the first-time tip is placed under it.
 */
export function GuideBulb({ q, picked, signedIn }: { q: QuizQuestion; picked: number | null; signedIn: boolean }) {
  const lessons = lessonsForQuestion(q.course, q.unit);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("trick");
  const seen = seenStore.useStore();
  const hydrated = useHydrated();
  if (lessons.length === 0) return null;

  const main = lessons[0];
  const others = lessons.slice(1);
  const steps = trickSteps(main);
  const showTip = hydrated && !seen;
  const closeSheet = () => {
    setOpen(false);
    setTab("trick");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          seenStore.set(true);
          setOpen(true);
        }}
        aria-label={`Show the trick for this topic: ${main.title}`}
        className="relative flex h-12 w-12 items-center justify-center rounded-option border-2 border-gold bg-gold/20 text-text"
      >
        <Lightbulb size={22} aria-hidden />
        {showTip && <span aria-hidden className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-surface" />}
      </button>

      {showTip && !open && (
        <div role="status" className="absolute right-0 top-15 z-30 w-56 rounded-option bg-text p-3 text-bg shadow-xl">
          <span aria-hidden className="absolute -top-1.5 right-17.5 h-3.5 w-3.5 rotate-45 rounded-xs bg-text" />
          <p className="text-[15px] font-bold leading-snug">Stuck? Tap the bulb for a short trick on this topic.</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-sm opacity-80">Practice quizzes only</span>
            <button type="button" onClick={() => seenStore.set(true)} className="min-h-12 rounded-full bg-bg px-4 text-[15px] font-extrabold text-text">
              Got it
            </button>
          </div>
        </div>
      )}

      {open && (
        <Sheet title={`Trick: ${main.title}`} onClose={closeSheet}>
          <div className="mt-3 flex gap-1 rounded-full bg-line/60 p-1" role="tablist" aria-label="Kind of help">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "trick"}
              onClick={() => setTab("trick")}
              className={`flex h-12 flex-1 items-center justify-center rounded-full text-[15px] font-bold ${tab === "trick" ? "bg-surface text-accent shadow-sm" : "text-soft"}`}
            >
              The trick
            </button>
            {/* picture questions have no AI explanation */}
            {!q.optionImages && (
              <button
                type="button"
                role="tab"
                aria-selected={tab === "ai"}
                onClick={() => setTab("ai")}
                className={`flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full text-[15px] font-bold ${tab === "ai" ? "bg-surface text-accent shadow-sm" : "text-soft"}`}
              >
                <Sparkles size={15} aria-hidden /> Explain it (AI)
              </button>
            )}
          </div>

          {tab === "trick" ? (
            <div role="tabpanel" className="mt-4">
              {steps.length > 0 && (
                <div className="rounded-card border border-line bg-bg p-3.5">
                  <StepList steps={steps} />
                </div>
              )}
              <p className="mt-3 flex items-center gap-3 rounded-card border border-gold/60 bg-gold/15 p-3 text-[15px]">
                <Lightbulb size={20} className="shrink-0" aria-hidden />
                <span>This is a hint, not the answer. Pick your option first.</span>
              </p>
              {others.length > 0 && (
                <p className="mt-3 text-[15px]">
                  Also see:{" "}
                  {others.map((l, i) => (
                    <span key={l.id}>
                      {i > 0 && ", "}
                      <Link href={lessonHref(l, "/quiz")} className="font-bold text-accent">{l.title}</Link>
                    </span>
                  ))}
                </p>
              )}
              <div className="mt-4 space-y-3">
                <button type="button" onClick={closeSheet} className="flex h-13 w-full items-center justify-center gap-1.5 rounded-option bg-accent text-base font-bold text-accent-ink">
                  <X size={18} aria-hidden /> Back to question
                </button>
                <Link href={lessonHref(main, "/quiz")} className="flex h-13 w-full items-center justify-center rounded-option border border-line text-base font-bold">
                  Read full lesson
                </Link>
              </div>
            </div>
          ) : (
            <div role="tabpanel" className="mt-4">
              {picked === null ? (
                <p className="rounded-card border border-line bg-bg p-3.5 text-base leading-relaxed">
                  Answer the question first. The AI explanation shows the answer, so it opens once you have tried.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <ExplainMore key={q.id} questionId={q.id} signedIn={signedIn} />
                  </div>
                  <p className="mt-3 text-[15px] text-soft">It uses one of your 10 AI requests a day. Saved explanations are free.</p>
                </>
              )}
              <button type="button" onClick={closeSheet} className="mt-4 flex h-13 w-full items-center justify-center rounded-option bg-accent text-base font-bold text-accent-ink">
                Back to question
              </button>
            </div>
          )}
        </Sheet>
      )}
    </>
  );
}
