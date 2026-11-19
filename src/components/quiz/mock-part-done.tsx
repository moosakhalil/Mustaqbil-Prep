"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Flag } from "lucide-react";
import { sectionTitle, type SectionId } from "@/lib/military";
import { continueMock, type Mock } from "@/lib/military-mock";
import { PASS_MARK, passes } from "@/lib/military-rules";
import { scoreQuiz } from "@/lib/quiz/score";
import type { Attempt } from "@/lib/quiz/attempt-logic";
import { SaveTag } from "./save-tag";

/**
 * The screen after a part of a full mock test (not the last): "Congratulations" at 50% or more, "Keep going" below it,
 * and one button that starts the next part. The next part's clock starts only when that button is tapped.
 */
export function MockPartDone({ attempt, mock, signedIn }: { attempt: Attempt; mock: Mock; signedIn: boolean }) {
  const router = useRouter();
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState("");

  const percent = Math.round(scoreQuiz(attempt.questions, attempt.answers).percent);
  const passed = passes(percent);
  const title = (id: string) => sectionTitle(mock.course, id as SectionId);
  const doneTitle = attempt.section ? title(attempt.section) : "This part";
  const firstOpen = mock.parts.findIndex((p) => p.attemptId === null);
  const next = firstOpen >= 0 ? mock.parts[firstOpen] : null;

  async function start() {
    setMoving(true);
    setError("");
    const result = await continueMock();
    if (result === "quiz") router.push("/quiz");
    else if (result === "result") router.push("/military/mock-result");
    else {
      setError("The next part could not be loaded. Check your connection and try again.");
      setMoving(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col items-center justify-center text-center">
      <div className={`flex h-20 w-20 items-center justify-center rounded-full ${passed ? "bg-ok/15 text-ok" : "bg-warn/15 text-warn"}`} aria-hidden>
        {passed ? <Check size={42} strokeWidth={2.5} /> : <Flag size={36} strokeWidth={2.5} />}
      </div>
      <h1 className="mt-4 text-2xl font-extrabold" role="status">{passed ? "Congratulations!" : "Keep going"}</h1>
      <p className="mt-2 font-bold">{doneTitle} done · {percent}%</p>
      <p className="mt-1 max-w-xs text-sm text-soft">
        {passed ? `Above the ${PASS_MARK}% pass line.` : `Below the ${PASS_MARK}% pass line. The summary at the end covers every part.`}
      </p>

      <ol className="mt-5 flex items-center gap-1.5" aria-label="Parts of the mock test">
        {mock.parts.map((p, i) => {
          const done = p.attemptId !== null;
          const current = i === firstOpen;
          return (
            <li key={p.section} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden className="h-0.5 w-6 bg-line" />}
              <span
                aria-label={`${title(p.section)}${done ? ", done" : current ? ", next" : ""}`}
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-extrabold ${
                  done ? "border-ok bg-ok text-bg" : current ? "border-military text-military" : "border-line text-soft"
                }`}
              >
                {done ? <Check size={14} strokeWidth={3} aria-hidden /> : i + 1}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-note text-soft">{mock.parts.map((p) => title(p.section)).join(" · ")}</p>

      {next && (
        <div className="mt-8 w-full max-w-sm">
          <button type="button" onClick={start} disabled={moving} className="flex h-14 w-full items-center justify-center rounded-option bg-military text-base font-bold text-bg disabled:opacity-60">
            {moving ? "Loading…" : `Start ${title(next.section)}`}
          </button>
          {error && <p role="alert" className="mt-2 text-sm font-semibold text-bad">{error}</p>}
          <SaveTag signedIn={signedIn} className="mt-3 justify-center" />
        </div>
      )}
    </div>
  );
}
