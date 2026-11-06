"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useBookmarks } from "@/lib/bookmarks";
import { isFinished, type Attempt } from "@/lib/quiz/attempt-logic";
import { useAttempt } from "@/lib/quiz/attempt";
import { useHydrated } from "@/lib/session-store";
import { ImageOptions, QuestionFigure } from "./image-options";
import { LETTERS, OptionButton, type OptionState } from "./option-button";
import { BookmarkButton, ExplainMore, ReportButton } from "./question-actions";
import { courseTitle, unitTitle } from "./topic-bars";

type Filter = "wrong" | "all" | "bookmarked";

/** Review of a finished quiz: the one on this phone, or a saved one passed in from the history. */
export function ReviewView({ signedIn, attempt: given, backHref = "/quiz/result" }: { signedIn: boolean; attempt?: Attempt; backHref?: string }) {
  const hydrated = useHydrated();
  const stored = useAttempt();
  const attempt = given ?? stored;
  const marks = useBookmarks(signedIn);
  const [filter, setFilter] = useState<Filter>("wrong");

  if (!hydrated) return null;
  if (!attempt || !isFinished(attempt)) {
    return (
      <div className="pt-10 text-center">
        <p className="text-soft">No finished quiz to review yet.</p>
        <Link href="/practice" className="mt-5 inline-flex h-12 items-center rounded-option bg-accent px-6 font-bold text-accent-ink">
          Build your quiz
        </Link>
      </div>
    );
  }

  const filters: Filter[] = signedIn ? ["wrong", "all", "bookmarked"] : ["wrong", "all"];
  const items = attempt.questions
    .map((q, i) => ({ q, number: i + 1, picked: attempt.answers[q.id] ?? null }))
    .filter(({ q, picked }) => (filter === "all" ? true : filter === "bookmarked" ? !!marks?.has(q.id) : picked !== q.answer));

  return (
    <div>
      <div className="relative flex h-12 items-center justify-center">
        <Link href={backHref} aria-label="Back to results" className="absolute left-0 flex h-12 w-12 items-center justify-center rounded-option border border-line bg-surface">
          <ChevronLeft size={20} aria-hidden />
        </Link>
        <h1 className="text-lg font-bold">Review</h1>
      </div>

      <div className="mt-4 flex gap-2" role="group" aria-label="Filter">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`h-10 rounded-full px-4 text-sm font-semibold ${filter === f ? "bg-accent/20 text-accent ring-1 ring-accent" : "bg-line/60 text-soft"}`}
          >
            {f === "wrong" ? "Wrong or skipped" : f === "all" ? "All" : "Bookmarked"}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="mt-8 text-center text-soft">
          {filter === "bookmarked" ? "No bookmarked questions in this quiz." : "Nothing to review here. Every question was answered correctly."}
        </p>
      ) : (
        <ol className="mt-5 space-y-8">
          {items.map(({ q, number, picked }) => (
            <li key={q.id}>
              <div className="flex items-start justify-between gap-3">
                <p className="pt-3 text-xs font-semibold text-soft">
                  {number}. {courseTitle(q.course)} · {unitTitle(q.course, q.unit)}
                </p>
                <BookmarkButton questionId={q.id} signedIn={signedIn} />
              </div>
              {q.q && <h2 className="text-[17px] font-bold leading-snug">{q.q}</h2>}
              {q.img && <div className="mt-2"><QuestionFigure src={q.img} label={`Question figure ${number}`} /></div>}
              <p className="mt-2 text-xs font-bold">
                {picked === null ? <span className="text-soft">You skipped this question</span> : picked === q.answer ? <span className="text-ok">You answered correctly</span> : <span className="text-bad">You answered wrongly</span>}
              </p>
              {q.optionImages ? (
                <div className="mt-3">
                  <ImageOptions q={q} answered={picked} reveal onConfirm={() => {}} readOnly />
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {q.options.map((text, i) => {
                    const state: OptionState = i === q.answer ? "correct" : i === picked ? "wrong" : "idle";
                    return <OptionButton key={i} letter={LETTERS[i]} text={text} state={state} disabled />;
                  })}
                </div>
              )}
              {q.explanation && <p className="mt-3 rounded-card border border-line bg-surface p-3 text-sm leading-relaxed">{q.explanation}</p>}
              <div className="mt-3 space-y-2">
                {!q.optionImages && <ExplainMore questionId={q.id} signedIn={signedIn} />}
                <ReportButton questionId={q.id} signedIn={signedIn} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
