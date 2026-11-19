"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ChevronRight, Pause, Play } from "lucide-react";
import { formatClock } from "@/components/quiz/runner";
import { SaveTag } from "@/components/quiz/save-tag";
import { Skeleton } from "@/components/ui/skeleton";
import { militaryTitle, sectionTitle, type SectionId } from "@/lib/military";
import { continueMock, mockInProgress, useMock, type Mock } from "@/lib/military-mock";
import { answeredCount, restingRemainingMs, type Attempt } from "@/lib/quiz/attempt-logic";
import { useAttempt } from "@/lib/quiz/attempt";
import { resumeSaved, useSavedList } from "@/lib/quiz/library";
import { useHydrated } from "@/lib/session-store";

const card = "rounded-card border border-line bg-surface p-4 text-left";

/** Time left on an exam that is not running (nothing ticks on Home), or null for a practice quiz. */
function timeLeft(a: Attempt): string | null {
  return a.mode === "exam" && a.minutes > 0 ? formatClock(restingRemainingMs(a)) : null;
}

function QuizItem({ a, variant }: { a: Attempt; variant: "full" | "row" }) {
  const router = useRouter();
  const total = a.questions.length;
  const answered = answeredCount(a);
  const left = timeLeft(a);
  const resume = () => {
    resumeSaved(a.id);
    router.push("/quiz");
  };
  if (variant === "row") {
    return (
      <div className={`${card} flex items-center justify-between gap-3 py-3`}>
        <span className="min-w-0">
          <span className="block truncate font-bold">{a.label}</span>
          <span className="text-note text-soft">{answered} of {total} answered{left ? ` · ${left} left, paused` : ""}</span>
        </span>
        <button type="button" onClick={resume} aria-label={`Resume ${a.label}`} className="flex h-11 shrink-0 items-center gap-1 rounded-option bg-accent px-3 text-sm font-bold text-accent-ink">
          <Play size={14} aria-hidden /> Resume
        </button>
      </div>
    );
  }
  return (
    <div className={`${card} flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate font-bold">{a.label}</p>
        {left ? (
          <span className="shrink-0 text-sm font-extrabold tabular-nums">{left} left</span>
        ) : (
          <span className="shrink-0 text-note font-semibold text-soft">{answered} of {total} answered</span>
        )}
      </div>
      <span aria-hidden className="block h-2 overflow-hidden rounded-full bg-line">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${total ? Math.round((answered / total) * 100) : 0}%` }} />
      </span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={resume} aria-label={`Resume ${a.label}`} className="flex h-12 flex-1 items-center justify-center gap-1 rounded-option bg-accent font-bold text-accent-ink">
          <Play size={16} aria-hidden /> Resume
        </button>
        <span className="flex shrink-0 items-center gap-1 text-note font-semibold text-soft">
          {left ? (
            <>
              <Pause size={12} aria-hidden /> Paused · {answered} of {total}
            </>
          ) : (
            "Practice"
          )}
        </span>
      </div>
    </div>
  );
}

function Dots({ mock }: { mock: Mock }) {
  const open = mock.parts.findIndex((p) => p.attemptId === null);
  return (
    <ol className="flex items-center gap-1.5" aria-label="Parts of the mock test">
      {mock.parts.map((p, i) => (
        <li key={p.section} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden className="h-0.5 w-5 bg-line" />}
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[11px] font-extrabold ${
              p.attemptId !== null ? "border-ok bg-ok text-bg" : i === open ? "border-military text-military" : "border-line text-soft"
            }`}
          >
            {p.attemptId !== null ? <Check size={12} strokeWidth={3} aria-hidden /> : i + 1}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** The mock test in progress: resume the part that was left, or start the next part. */
function MockItem({ mock, part, variant }: { mock: Mock; part: Attempt | undefined; variant: "full" | "row" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const title = (id: string) => sectionTitle(mock.course, id as SectionId);
  const open = mock.parts.findIndex((p) => p.attemptId === null);
  if (!part && open < 0) return null;

  const heading = `${militaryTitle(mock.course)} mock test`;
  const doneBefore = open > 0 ? mock.parts[open - 1] : null;
  const partNumber = part ? mock.parts.findIndex((p) => p.section === part.section) + 1 : open + 1;
  const left = part ? timeLeft(part) : null;
  const nextTitle = open >= 0 ? title(mock.parts[open].section) : "";

  async function start() {
    setBusy(true);
    setError("");
    const result = await continueMock();
    if (result === "quiz") router.push("/quiz");
    else if (result === "result") router.push("/military/mock-result");
    else {
      setError("Could not load the next part. Check your connection and try again.");
      setBusy(false);
    }
  }
  const resume = () => {
    if (!part) return;
    resumeSaved(part.id);
    router.push("/quiz");
  };

  return (
    <div className={`${card} flex flex-col gap-2.5 ${variant === "row" ? "py-3" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate font-bold">{heading}</p>
        {left ? <span className="shrink-0 text-sm font-extrabold tabular-nums">{left} left</span> : <span className="shrink-0 text-note font-semibold text-soft">Part {partNumber} of {mock.parts.length}</span>}
      </div>
      {variant === "full" && <Dots mock={mock} />}
      <p className="text-note text-soft">
        {part
          ? `Part ${partNumber} of ${mock.parts.length} · ${part.section ? title(part.section) : "Part"} · ${answeredCount(part)} of ${part.questions.length} answered`
          : doneBefore
            ? `${title(doneBefore.section)} ${Math.round(doneBefore.percent ?? 0)}% · next: ${nextTitle}`
            : `Not started · first part: ${nextTitle}`}
      </p>
      <div className="flex items-center gap-3">
        {part ? (
          <button type="button" onClick={resume} className="flex h-12 flex-1 items-center justify-center gap-1 rounded-option bg-military font-bold text-bg">
            <Play size={16} aria-hidden /> Resume
          </button>
        ) : (
          <button type="button" onClick={start} disabled={busy} className="flex h-12 flex-1 items-center justify-center rounded-option bg-military font-bold text-bg disabled:opacity-60">
            {busy ? "Loading…" : `Start ${nextTitle}`}
          </button>
        )}
        {part && left && (
          <span className="flex shrink-0 items-center gap-1 text-note font-semibold text-soft">
            <Pause size={12} aria-hidden /> Paused
          </span>
        )}
      </div>
      {error && <p role="alert" className="text-note font-semibold text-bad">{error}</p>}
    </div>
  );
}

/**
 * "Continue where you stopped": the mock test in progress and every saved quiz (up to three), newest first,
 * or an invitation to start for a new person. "full" (Home) has progress bars and wide buttons; "row" (Academia) is slim rows.
 */
export function ContinueCard({ variant = "full", signedIn = true }: { variant?: "full" | "row"; signedIn?: boolean }) {
  const hydrated = useHydrated();
  const saved = useSavedList();
  const mock = useMock();
  const attempt = useAttempt();
  if (!hydrated) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading your last quiz">
        <Skeleton className={`${variant === "row" ? "h-18" : "h-24"} rounded-card`} />
      </div>
    );
  }

  const quizzes = saved.filter((a) => !a.mockId);
  const mockOn = mockInProgress(mock) ? mock : null;
  const part = mockOn ? saved.find((a) => a.mockId === mockOn.id) : undefined;
  const mockShown = !!mockOn && (!!part || mockOn.parts.some((p) => p.attemptId === null));

  if (!mockShown && quizzes.length === 0) {
    return (
      <Link href="/practice" className={`${card} flex items-center justify-between gap-3`}>
        <span>
          <span className="font-bold">{attempt ? "Start another quiz" : "Take your first quiz"}</span>
          <span className="block text-sm text-soft">Pick courses and chapters, then go.</span>
        </span>
        <ChevronRight size={20} className="text-soft" aria-hidden />
      </Link>
    );
  }

  return (
    <section aria-label="Continue where you stopped" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-soft">Continue where you stopped</h2>
        <SaveTag signedIn={signedIn} />
      </div>
      {mockShown && mockOn && <MockItem mock={mockOn} part={part} variant={variant} />}
      {quizzes.map((a) => (
        <QuizItem key={a.id} a={a} variant={variant} />
      ))}
      {!signedIn && (
        <p className="rounded-card border border-gold bg-gold/15 p-3 text-sm">
          <b>Keep this on every device.</b> <Link href="/sign-in" className="font-bold text-accent">Sign in</Link> and your quizzes follow you to any phone.
        </p>
      )}
    </section>
  );
}
