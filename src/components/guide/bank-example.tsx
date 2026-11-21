"use client";

import { useEffect, useState } from "react";
import { cleanExplanation, toQuizQuestion } from "@/lib/guide/facts";
import { loadCourse } from "@/lib/question-loader";
import type { QuizQuestion } from "@/lib/quiz/build";
import { ImageOptions, QuestionFigure } from "@/components/quiz/image-options";
import { Skeleton } from "@/components/ui/skeleton";

const BANK = "mil-nonverbal";

/** A real Non-verbal question with its figure, the four option figures (the right one marked) and the bank's own explanation. */
export function BankExample({ title, questionId }: { title: string; questionId: string }) {
  const [q, setQ] = useState<QuizQuestion | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadCourse(BANK)
      .then((all) => {
        const found = all.find((x) => x.id === questionId);
        if (cancelled) return;
        if (found) setQ(toQuizQuestion(found, BANK));
        else setFailed(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [questionId]);

  const why = q ? cleanExplanation(q.explanation) : "";

  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <h2 className="text-xl font-extrabold leading-tight">{title}</h2>
      {failed ? (
        <p role="status" className="mt-3 text-[15px] text-soft">The picture could not be loaded. Check your connection and open this lesson again.</p>
      ) : !q ? (
        <div role="status" aria-busy="true" aria-label="Loading the example">
          <Skeleton className="mt-3 h-40 w-full" />
          <Skeleton className="mt-3 h-24 w-full" />
        </div>
      ) : (
        <>
          {q.img && (
            <div className="mt-3">
              <QuestionFigure src={q.img} label="Example question figure" />
            </div>
          )}
          {q.optionImages && (
            <div className="mt-3">
              <ImageOptions q={q} answered={null} reveal readOnly onPick={() => {}} />
            </div>
          )}
          <p className="mt-3 flex flex-wrap items-baseline gap-x-3 rounded-option border-2 border-ok bg-ok/10 px-4 py-2.5">
            <span className="text-sm font-bold text-soft">Answer</span>
            <span className="text-xl font-extrabold leading-snug">Option {q.answer + 1}</span>
          </p>
          {why && <p className="mt-3 text-base leading-relaxed">{why}</p>}
        </>
      )}
    </div>
  );
}
