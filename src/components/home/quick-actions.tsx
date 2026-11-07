"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookMarked, ChevronRight, NotebookPen, Play, Zap } from "lucide-react";
import { StartConfirm } from "@/components/quiz/start-confirm";
import { Skeleton } from "@/components/ui/skeleton";
import { manifest } from "@/lib/manifest";
import { isFinished } from "@/lib/quiz/attempt-logic";
import { useAttempt } from "@/lib/quiz/attempt";
import { startFromQuestionIds, startQuick, wholeCourses } from "@/lib/quiz/quick-start";
import { setSelection } from "@/lib/quiz/selection";
import type { Selection } from "@/lib/quiz/selection-logic";
import { useHydrated } from "@/lib/session-store";

const card = "rounded-card border border-line bg-surface p-4 text-left";
const nf = new Intl.NumberFormat("en");

/**
 * "Continue where you stopped", or an invitation to start for a new person.
 * "full" (Home) shows a progress bar and a wide Resume button; "row" (Academia) is one slim row with a small Resume button.
 */
export function ContinueCard({ variant = "full" }: { variant?: "full" | "row" }) {
  const hydrated = useHydrated();
  const attempt = useAttempt();
  if (!hydrated) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading your last quiz">
        <Skeleton className={`${variant === "row" ? "h-18" : "h-24"} rounded-card`} />
      </div>
    );
  }

  if (attempt && !isFinished(attempt)) {
    const answered = Object.values(attempt.answers).filter((a) => a != null).length;
    const total = attempt.questions.length;
    if (variant === "row") {
      return (
        <Link href="/quiz" className={`${card} flex items-center justify-between gap-3 py-3`}>
          <span className="min-w-0">
            <span className="block truncate font-bold">Continue: {attempt.label}</span>
            <span className="text-note text-soft">{answered} of {total} answered</span>
          </span>
          <span className="flex h-11 shrink-0 items-center gap-1 rounded-option bg-accent px-3 text-sm font-bold text-accent-ink"><Play size={14} aria-hidden /> Resume</span>
        </Link>
      );
    }
    return (
      <Link href="/quiz" className={`${card} flex flex-col gap-3`}>
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="text-xs font-bold uppercase tracking-wide text-soft">Continue where you stopped</span>
            <span className="mt-1 block truncate font-bold">{attempt.label}</span>
          </span>
          <span className="shrink-0 text-note font-semibold text-soft">{answered} of {total} answered</span>
        </span>
        <span aria-hidden className="block h-2 overflow-hidden rounded-full bg-line">
          <span className="block h-full rounded-full bg-accent" style={{ width: `${total ? Math.round((answered / total) * 100) : 0}%` }} />
        </span>
        <span className="flex h-12 items-center justify-center gap-1 rounded-option bg-accent font-bold text-accent-ink"><Play size={16} aria-hidden /> Resume</span>
      </Link>
    );
  }
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

/**
 * A quick quiz (tile, Daily 10, weak chapter) that asks first: shows what is in it and starts only when the person agrees.
 * `onOpen` is the tile's own button; the window is drawn here.
 */
function QuickQuiz({
  title, selection, count, topics, note, render,
}: {
  title: string;
  selection: Selection;
  count: number;
  topics: string[];
  note?: string;
  render: (open: () => void) => React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  return (
    <>
      {render(() => { setError(""); setOpen(true); })}
      {open && (
        <StartConfirm
          title={title}
          lines={[
            { label: "Questions", value: String(count) },
            { label: "Mode", value: "Practice (instant answers)" },
            { label: "Time", value: "No time limit" },
          ]}
          topics={topics}
          note={note}
          error={error}
          onClose={() => setOpen(false)}
          onStart={() => {
            if (startQuick(selection, count)) router.push("/quiz");
            else setError("This quiz could not be built.");
          }}
        />
      )}
    </>
  );
}

/** Daily 10: ten random questions from every course. */
export function DailyTen() {
  const all = manifest.courses.map((c) => c.id);
  return (
    <QuickQuiz
      title="Daily 10"
      selection={wholeCourses(all)}
      count={10}
      topics={manifest.courses.map((c) => c.title)}
      note={`Ten random questions, mixed from all ${all.length} courses.`}
      render={(open) => (
        <button type="button" onClick={open} className={`${card} flex-1`}>
          <Zap size={20} className="text-gold" aria-hidden />
          <span className="mt-2 block font-bold">Daily 10</span>
          <span className="text-xs text-soft">Mixed, 5 min</span>
        </button>
      )}
    />
  );
}

/** The wrong-answer notebook: practise the questions you got wrong and have not answered correctly since. */
export function NotebookTile({ signedIn, count }: { signedIn: boolean; count: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const body = (
    <>
      <NotebookPen size={20} className="text-accent" aria-hidden />
      <span className="mt-2 block font-bold">Wrong notebook</span>
      <span className="text-note text-soft">{signedIn ? (count > 0 ? `${count} to revise` : "Nothing to revise") : "Sign in to use"}</span>
    </>
  );
  if (!signedIn) return <Link href="/sign-in" className={`${card} flex-1`}>{body}</Link>;

  async function start() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/wrong");
      const { ids } = (await res.json()) as { ids: string[] };
      if (await startFromQuestionIds(ids, "Wrong notebook")) router.push("/quiz");
      else setError("No questions found.");
    } catch {
      setError("No connection.");
    }
    setBusy(false);
  }

  return (
    <div className="flex-1">
      <button type="button" disabled={count === 0} onClick={() => { setError(""); setOpen(true); }} className={`${card} w-full disabled:opacity-60`}>
        {body}
      </button>
      {open && (
        <StartConfirm
          title="Wrong notebook"
          lines={[
            { label: "Questions", value: `Up to ${Math.min(20, count)} of your ${count}` },
            { label: "Mode", value: "Practice (instant answers)" },
            { label: "Time", value: "No time limit" },
          ]}
          note="Questions you answered wrongly and have not answered correctly since, in random order."
          busy={busy}
          error={error}
          onClose={() => setOpen(false)}
          onStart={start}
        />
      )}
    </div>
  );
}

/** Quick start: 20 questions from one whole course. */
export function CourseTile({ id }: { id: string }) {
  const course = manifest.courses.find((c) => c.id === id);
  if (!course) return null;
  const count = Math.min(20, course.total);
  return (
    <QuickQuiz
      title={course.title}
      selection={wholeCourses([id])}
      count={count}
      topics={course.units.map((u) => u.title)}
      note={`${count} random questions from all ${course.units.length} chapters of this course.`}
      render={(open) => (
        <button type="button" onClick={open} className={`${card} w-40`}>
          <BookMarked size={18} className="text-accent" aria-hidden />
          <span className="mt-2 line-clamp-2 block min-h-10 text-sm font-bold">{course.title}</span>
          <span className="text-note text-soft">{nf.format(course.total)} questions</span>
        </button>
      )}
    />
  );
}

/** A weak chapter as a 48px row with a bar: it asks first, then starts a 10-question quiz on that chapter. */
export function WeakRow({ course, unit, percent }: { course: string; unit: number; percent: number }) {
  const c = manifest.courses.find((x) => x.id === course);
  const u = c?.units.find((x) => x.n === unit);
  if (!c || !u) return null;
  const count = Math.min(10, u.count);
  const selection = { [course]: [unit] };
  const low = percent < 50;
  return (
    <QuickQuiz
      title={u.title}
      selection={selection}
      count={count}
      topics={[`${c.title}: ${u.title}`]}
      note={`Your score on this chapter so far: ${percent}%.`}
      render={(open) => (
        <button
          type="button"
          onClick={() => { setSelection(selection); open(); }}
          aria-label={`Practise ${c.title}: ${u.title}, your score is ${percent}%`}
          className="flex min-h-12 w-full items-center gap-3 rounded-card border border-line bg-surface py-1.5 pl-4 pr-3 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">{c.title} · {u.title}</span>
            <span aria-hidden className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-line">
              <span className={`block h-full rounded-full ${low ? "bg-bad" : "bg-warn"}`} style={{ width: `${Math.max(4, percent)}%` }} />
            </span>
          </span>
          <b className={`text-note tabular-nums ${low ? "text-bad" : "text-warn"}`}>{percent}%</b>
          <span aria-hidden className="flex h-11 shrink-0 items-center gap-0.5 text-sm font-bold text-accent">Practise <ChevronRight size={16} /></span>
        </button>
      )}
    />
  );
}
