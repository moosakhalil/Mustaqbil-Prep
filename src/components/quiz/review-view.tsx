"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronLeft, CircleSlash, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookmarks } from "@/lib/bookmarks";
import { isFinished, type Attempt } from "@/lib/quiz/attempt-logic";
import { useAttempt } from "@/lib/quiz/attempt";
import { useHydrated } from "@/lib/session-store";
import { ImageOptions, QuestionFigure } from "./image-options";
import { LETTERS, OptionButton, type OptionState } from "./option-button";
import { BookmarkButton, ExplainMore, ReportButton } from "./question-actions";
import { Sheet } from "./sheet";
import { courseTitle, unitTitle } from "./topic-bars";

type Filter = "wrong" | "all" | "bookmarked";

/** The list is long enough to need a "where am I" bar and a Jump to button. */
const LONG_LIST = 4;

const itemId = (questionId: string) => `review-${questionId}`;

/** A solid badge with an icon and a word, so the result is clear even without colour. */
function StatusBadge({ picked, answer }: { picked: number | null; answer: number }) {
  const base = "inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-note font-bold";
  if (picked === null) {
    return (
      <span className={`${base} bg-line text-text`}>
        <CircleSlash size={16} aria-hidden /> Skipped
      </span>
    );
  }
  if (picked === answer) {
    return (
      <span className={`${base} bg-ok text-bg`}>
        <Check size={16} strokeWidth={3} aria-hidden /> Answered correctly
      </span>
    );
  }
  return (
    <span className={`${base} bg-bad text-bg`}>
      <X size={16} strokeWidth={3} aria-hidden /> Answered wrongly
    </span>
  );
}

/** A grey outline of the review screen while the saved quiz loads. */
function ReviewSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading your review">
      <Skeleton className="mx-auto h-12 w-40" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-11.5 w-44 rounded-full" />
        <Skeleton className="h-11.5 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-6 h-8 w-44 rounded-full" />
      <Skeleton className="mt-4 h-6 w-full" />
      <div className="mt-4 space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}

/** Review of a finished quiz: the one on this phone, or a saved one passed in from the history. */
export function ReviewView({ signedIn, attempt: given, backHref = "/quiz/result" }: { signedIn: boolean; attempt?: Attempt; backHref?: string }) {
  const hydrated = useHydrated();
  const stored = useAttempt();
  const attempt = given ?? stored;
  const marks = useBookmarks(signedIn);
  const [filter, setFilter] = useState<Filter>("wrong");
  const [pos, setPos] = useState(0); // which listed question is near the top of the screen
  const [jumping, setJumping] = useState(false);

  const all = useMemo(
    () => (attempt ? attempt.questions.map((q, i) => ({ q, number: i + 1, picked: attempt.answers[q.id] ?? null })) : []),
    [attempt],
  );
  const missedCount = all.filter(({ q, picked }) => picked !== q.answer).length;
  const items = useMemo(
    () => all.filter(({ q, picked }) => (filter === "all" ? true : filter === "bookmarked" ? !!marks?.has(q.id) : picked !== q.answer)),
    [all, filter, marks],
  );
  const listKey = items.map(({ q }) => q.id).join(",");
  const showBar = items.length > LONG_LIST;

  // follow the scroll: the question that is near the top of the screen is "the one I am on"
  useEffect(() => {
    if (!showBar) return;
    const els = listKey.split(",").map((id, i) => ({ el: document.getElementById(itemId(id)), i }));
    const seen = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setPos(seen.get(e.target) ?? 0);
        }
      },
      { rootMargin: "-100px 0px -65% 0px" },
    );
    for (const { el, i } of els) {
      if (!el) continue;
      seen.set(el, i);
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, [listKey, showBar]);

  if (!hydrated) return <ReviewSkeleton />;
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
  const countOf = (f: Filter) => (f === "wrong" ? missedCount : f === "all" ? all.length : all.filter(({ q }) => !!marks?.has(q.id)).length);
  const current = Math.min(pos, Math.max(0, items.length - 1));
  const noun = filter === "wrong" ? " missed" : filter === "bookmarked" ? " bookmarked" : "";

  function jumpTo(i: number) {
    setJumping(false);
    setPos(i);
    const el = document.getElementById(itemId(items[i].q.id));
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
  }

  return (
    <div>
      <div className="relative flex h-12 items-center justify-center">
        <Link href={backHref} aria-label="Back to results" className="absolute left-0 flex h-12 w-12 items-center justify-center rounded-option border border-line bg-surface">
          <ChevronLeft size={20} aria-hidden />
        </Link>
        <h1 className="text-lg font-bold">Review</h1>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => {
              setFilter(f);
              setPos(0);
            }}
            className={`h-11.5 rounded-full px-4 text-sm font-semibold ${filter === f ? "bg-accent/20 text-accent ring-1 ring-accent" : "bg-line/60 text-soft"}`}
          >
            {f === "wrong" ? "Wrong or skipped" : f === "all" ? "All" : "Bookmarked"} · {countOf(f)}
          </button>
        ))}
      </div>

      {showBar && (
        <div className="sticky top-0 z-10 -mx-5 mt-3 border-b border-line bg-bg px-5 py-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-note font-bold" aria-live="polite">
              Question {current + 1} of {items.length}{noun}
            </p>
            <button type="button" onClick={() => setJumping(true)} className="flex min-h-11 items-center gap-1 text-note font-bold text-accent">
              Jump to <ChevronDown size={16} aria-hidden />
            </button>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
            <div className="h-full rounded-full bg-accent" style={{ width: `${((current + 1) / items.length) * 100}%` }} />
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="mt-8 text-center text-soft">
          {filter === "bookmarked" ? "No bookmarked questions in this quiz." : "Nothing to review here. Every question was answered correctly."}
        </p>
      ) : (
        <ol className="mt-5 space-y-8">
          {items.map(({ q, number, picked }) => (
            <li key={q.id} id={itemId(q.id)} className="scroll-mt-24">
              <div className="flex items-center justify-between gap-3">
                <StatusBadge picked={picked} answer={q.answer} />
                <BookmarkButton questionId={q.id} signedIn={signedIn} />
              </div>
              <p className="mt-2 text-xs font-semibold text-soft">
                {number}. {courseTitle(q.course)} · {unitTitle(q.course, q.unit)}
              </p>
              {q.q && <h2 className="mt-1 text-[17px] font-bold leading-snug">{q.q}</h2>}
              {q.img && <div className="mt-2"><QuestionFigure src={q.img} label={`Question figure ${number}`} /></div>}
              {q.optionImages ? (
                <div className="mt-3">
                  <ImageOptions q={q} answered={picked} reveal onConfirm={() => {}} readOnly />
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {q.options.map((text, k) => {
                    const state: OptionState = k === q.answer ? "correct" : k === picked ? "wrong" : "idle";
                    return <OptionButton key={k} letter={LETTERS[k]} text={text} state={state} disabled />;
                  })}
                </div>
              )}
              {q.explanation && (
                <p className="mt-3 rounded-card border border-l-4 border-line border-l-ok bg-surface p-3 text-sm leading-relaxed">
                  <b className="text-ok">Why {LETTERS[q.answer]}: </b>
                  {q.explanation}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                {!q.optionImages && <ExplainMore questionId={q.id} signedIn={signedIn} />}
                <ReportButton questionId={q.id} signedIn={signedIn} />
              </div>
            </li>
          ))}
        </ol>
      )}

      {jumping && (
        <Sheet title="Jump to a question" onClose={() => setJumping(false)}>
          <ul className="mt-4 grid grid-cols-5 gap-2">
            {items.map(({ q, number, picked }, i) => {
              const status = picked === null ? "skipped" : picked === q.answer ? "correct" : "wrong";
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => jumpTo(i)}
                    aria-label={`Question ${number}, ${status}`}
                    aria-current={i === current ? "true" : undefined}
                    className={`flex h-12 w-full items-center justify-center gap-0.5 rounded-option text-sm font-bold ${
                      status === "wrong" ? "bg-bad/15 text-bad" : status === "correct" ? "bg-ok/15 text-ok" : "bg-line/70 text-soft"
                    } ${i === current ? "ring-2 ring-text" : ""}`}
                  >
                    {number}
                    {status === "wrong" ? <X size={12} strokeWidth={3} aria-hidden /> : status === "correct" ? <Check size={12} strokeWidth={3} aria-hidden /> : <CircleSlash size={12} aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-note text-soft">Red cross = wrong · Green tick = correct · Grey = skipped</p>
        </Sheet>
      )}
    </div>
  );
}
