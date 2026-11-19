"use client";

import { usePathname, useRouter } from "next/navigation";
import { answeredCount } from "@/lib/quiz/attempt-logic";
import { cancelPendingStart, confirmPendingStart, usePendingStart, useSavedList } from "@/lib/quiz/library";
import { SAVED_LIMIT } from "@/lib/quiz/library-logic";
import { setPlan } from "@/lib/quiz/settings";
import { Sheet } from "./sheet";

/**
 * Shown when a new quiz is started while three are already saved (or a new mock test while one is in progress).
 * Nothing is removed unless the student chooses it.
 */
export function SavedLimitWindow() {
  const pending = usePendingStart();
  const saved = useSavedList();
  const router = useRouter();
  const pathname = usePathname();
  if (!pending) return null;

  // oldest first, so the one most likely to be dropped is at the top
  const quizzes = saved.filter((a) => !a.mockId).sort((a, b) => a.enteredAt - b.enteredAt);

  function goBack() {
    cancelPendingStart();
    if (pathname.startsWith("/quiz")) {
      setPlan(null); // the quiz that was waiting is not started
      router.push("/home");
    }
  }
  function start(deleteId?: string) {
    confirmPendingStart(deleteId);
    router.push("/quiz");
  }

  return (
    <div className="relative z-50">
      {pending.kind === "mock" ? (
        <Sheet title="You have a mock test in progress" onClose={goBack}>
          <p className="mt-3 text-soft">Only one mock test is kept. Starting a new one deletes the one you have, with its saved part and scores.</p>
          <div className="mt-5 space-y-3">
            <button type="button" onClick={() => start()} className="h-12 w-full rounded-option border border-bad font-bold text-bad">
              Delete it and start
            </button>
            <button type="button" onClick={goBack} className="h-12 w-full rounded-option border border-line font-bold">
              Keep it, go back
            </button>
          </div>
        </Sheet>
      ) : (
        <Sheet title={`You have ${SAVED_LIMIT} saved quizzes`} onClose={goBack}>
          <p className="mt-3 text-soft">Finish or delete one to start a new quiz.</p>
          <ul className="mt-4 space-y-2">
            {quizzes.map((a, i) => (
              <li key={a.id} className="flex items-center gap-3 rounded-card border border-line p-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{a.label}</span>
                  <span className="text-note text-soft">
                    {answeredCount(a)} of {a.questions.length} answered{i === 0 ? " · oldest" : ""}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => start(a.id)}
                  aria-label={`Delete ${a.label} and start the new quiz`}
                  className="flex h-11 shrink-0 items-center rounded-option border border-bad px-3 text-sm font-bold text-bad"
                >
                  Delete and start
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={goBack} className="mt-4 h-12 w-full rounded-option border border-line font-bold">
            Keep all, go back
          </button>
        </Sheet>
      )}
    </div>
  );
}
