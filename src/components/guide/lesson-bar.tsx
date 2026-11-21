"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { PracticeSource } from "@/lib/guide/types";
import { setRead, useGuideRead } from "@/lib/guide/read";
import { isFinished } from "@/lib/quiz/attempt-logic";
import { useAttempt } from "@/lib/quiz/attempt";
import { TRY_COUNT, startLessonPractice } from "@/lib/quiz/guide-quiz";
import { useHydrated } from "@/lib/session-store";

/**
 * The bar at the bottom of a lesson.
 * Normally: mark it read, and try a few questions on the topic. `available` is how many questions the topic has; with none, the second button is left out.
 * Opened from inside a quiz (`back` is set): the main button takes the student straight back to the question they were on (the quiz keeps its place),
 * or back to the review they came from. "Try questions" is left out then, so a quick look at a lesson never starts a second quiz on top of the first.
 */
export function LessonBar({
  lessonKey, title, course, source, available, noun = "questions", back,
}: { lessonKey: string; title: string; course: string; source: PracticeSource; available: number; noun?: string; back?: string }) {
  const router = useRouter();
  const read = useGuideRead().has(lessonKey);
  const hydrated = useHydrated();
  const attempt = useAttempt();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const n = Math.min(TRY_COUNT, available);

  // a way back to the quiz only makes sense while that quiz is still open on this phone
  const openQuiz = attempt && !isFinished(attempt) ? attempt : null;
  const quizBack = back === "/quiz";
  const showBack = !!back && (!quizBack || !hydrated || !!openQuiz);
  const backLabel = quizBack ? (openQuiz ? `Back to question ${openQuiz.index + 1}` : "Back to your question") : "Back to your review";

  async function start() {
    setBusy(true);
    setError("");
    try {
      const result = await startLessonPractice({ title, course, source });
      if (result === "started") router.push("/quiz");
      else if (result === "failed") setError("No questions could be loaded for this topic.");
    } catch {
      setError("Could not load the questions. Check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20">
      <div className="mx-auto max-w-md rounded-t-sheet border border-b-0 border-line bg-surface px-4 pb-3 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        {error && <p role="alert" className="mb-2 text-[15px] font-semibold text-bad">{error}</p>}
        <div className="flex items-center gap-3">
          {showBack && back && (
            <button type="button" onClick={() => router.push(back)} className="flex h-13 flex-1 items-center justify-center gap-1 rounded-option bg-accent text-base font-bold text-accent-ink">
              <ChevronLeft size={20} aria-hidden /> {backLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => void setRead(lessonKey, !read)}
            aria-pressed={read}
            className={`flex h-13 shrink-0 items-center justify-center gap-1.5 rounded-option border px-4 text-[15px] font-bold ${read ? "border-ok text-ok" : "border-line"}`}
          >
            {read && <Check size={18} strokeWidth={3} aria-hidden />} {read ? "Read" : "Mark as read"}
          </button>
          {!showBack && n > 0 && (
            <button type="button" onClick={start} disabled={busy} className="flex h-13 flex-1 items-center justify-center gap-1 rounded-option bg-accent text-base font-bold text-accent-ink disabled:opacity-60">
              {busy ? "Loading…" : `Try ${n} ${noun}`} {!busy && <ChevronRight size={18} aria-hidden />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
