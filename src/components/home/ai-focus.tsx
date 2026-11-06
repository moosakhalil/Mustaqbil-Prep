"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { StartConfirm } from "@/components/quiz/start-confirm";
import type { FocusAction, FocusPlan } from "@/lib/ai-focus";
import { manifest } from "@/lib/manifest";
import { startQuick, wholeCourses } from "@/lib/quiz/quick-start";
import { setSelection } from "@/lib/quiz/selection";

type State = { kind: "checking" } | { kind: "idle" } | { kind: "making" } | { kind: "ready"; plan: FocusPlan } | { kind: "error"; message: string };

/** One suggested step. A quiz asks first ("Ready to start?"); a military part opens its own screen. */
function Step({ title, why, action }: { title: string; why: string; action: FocusAction }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const btn = "flex h-10 shrink-0 items-center gap-1 rounded-option bg-accent px-3 text-sm font-bold text-accent-ink";
  let start: React.ReactNode;
  let dialog: React.ReactNode = null;

  if (action.kind === "military") {
    start = (
      <Link href={`/military/${action.course}/${action.section}`} className={btn}>
        Start <ChevronRight size={16} aria-hidden />
      </Link>
    );
  } else {
    const course = manifest.courses.find((c) => c.id === action.course);
    const unit = action.kind === "topic" ? course?.units.find((u) => u.n === action.unit) : null;
    const selection = action.kind === "topic" ? { [action.course]: [action.unit] } : wholeCourses([action.course]);
    const count = action.kind === "topic" ? Math.min(10, unit?.count ?? 10) : Math.min(20, course?.total ?? 20);
    start = (
      <button type="button" className={btn} onClick={() => { setError(""); setOpen(true); }}>
        Start <ChevronRight size={16} aria-hidden />
      </button>
    );
    dialog = open && (
      <StartConfirm
        title={title}
        lines={[
          { label: "Questions", value: String(count) },
          { label: "Mode", value: "Practice (instant answers)" },
          { label: "Time", value: "No time limit" },
        ]}
        topics={action.kind === "topic" ? [action.label] : course ? course.units.map((u) => u.title) : []}
        note={`Suggested by your daily study plan: ${why}`}
        error={error}
        onClose={() => setOpen(false)}
        onStart={() => {
          if (action.kind === "topic") setSelection(selection);
          if (startQuick(selection, count)) router.push("/quiz");
          else setError("This quiz could not be built.");
        }}
      />
    );
  }

  return (
    <li className="flex items-start justify-between gap-3 rounded-card border border-line bg-surface p-3">
      <span className="min-w-0">
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-0.5 block text-xs text-soft">{why}</span>
      </span>
      {start}
      {dialog}
    </li>
  );
}

/**
 * "What should I study today?" button. Shows today's saved suggestion if there is one (free), or makes a new one.
 * scope is "home" or a military course id.
 */
export function AiFocusCard({ scope, signedIn }: { scope: string; signedIn: boolean }) {
  const [state, setState] = useState<State>({ kind: signedIn ? "checking" : "idle" });

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    fetch(`/api/ai/focus?scope=${encodeURIComponent(scope)}`)
      .then(async (res) => {
        if (cancelled) return;
        const data = res.ok ? ((await res.json()) as { plan: FocusPlan | null }) : null;
        if (data?.plan) setState({ kind: "ready", plan: data.plan });
        else setState({ kind: "idle" });
      })
      .catch(() => !cancelled && setState({ kind: "idle" }));
    return () => {
      cancelled = true;
    };
  }, [scope, signedIn]);

  async function make() {
    setState({ kind: "making" });
    try {
      const res = await fetch("/api/ai/focus", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scope }) });
      const data = (await res.json().catch(() => ({}))) as { plan?: FocusPlan; error?: string };
      if (res.ok && data.plan) setState({ kind: "ready", plan: data.plan });
      else setState({ kind: "error", message: data.error ?? "The AI helper could not make a suggestion. Please try again." });
    } catch {
      setState({ kind: "error", message: "No connection. The suggestion needs the internet." });
    }
  }

  if (!signedIn) {
    return (
      <Link href="/sign-in" className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface p-4">
        <span className="flex items-center gap-3">
          <Sparkles size={22} className="shrink-0 text-gold" aria-hidden />
          <span>
            <span className="block font-bold">What should I study today?</span>
            <span className="block text-xs text-soft">Sign in to get a suggestion from your results.</span>
          </span>
        </span>
        <ChevronRight size={20} className="text-soft" aria-hidden />
      </Link>
    );
  }

  if (state.kind === "checking") return <div className="h-16 rounded-card border border-line bg-surface" aria-hidden />;

  if (state.kind === "ready" && state.plan) {
    const { plan } = state;
    return (
      <section className="rounded-card border-2 border-gold/60 bg-gold/10 p-4" aria-label="Study today">
        <h2 className="flex items-center gap-2 font-extrabold">
          <Sparkles size={18} className="text-gold" aria-hidden /> Study today
          {plan.daysLeft !== null && <span className="ml-auto rounded-full bg-gold px-2.5 py-0.5 text-xs font-extrabold text-black">{plan.daysLeft} {plan.daysLeft === 1 ? "day" : "days"} to your test</span>}
        </h2>
        <p className="mt-2 text-sm">{plan.summary}</p>
        <ul className="mt-3 space-y-2">
          {plan.items.map((it, i) => (
            <Step key={i} title={it.title} why={it.why} action={it.action} />
          ))}
        </ul>
        <p className="mt-2 text-xs text-soft">{plan.ai ? "Made by AI from your results. Saved for today, so opening it again is free." : "A simple start, because you have no results yet. Finish a few quizzes and this becomes personal."}</p>
      </section>
    );
  }

  return (
    <div className="rounded-card border-2 border-gold/60 bg-gold/10 p-4">
      <button
        type="button"
        onClick={make}
        disabled={state.kind === "making"}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-option bg-gold font-extrabold text-black disabled:opacity-60"
      >
        <Sparkles size={18} aria-hidden /> {state.kind === "making" ? "Thinking…" : "What should I study today?"}
      </button>
      <p className="mt-2 text-xs text-soft">Uses 1 of your 10 AI requests today (none if you have no results yet), then it is saved for the day.</p>
      {state.kind === "error" && <p role="alert" className="mt-2 text-sm font-semibold text-bad">{state.message}</p>}
    </div>
  );
}
