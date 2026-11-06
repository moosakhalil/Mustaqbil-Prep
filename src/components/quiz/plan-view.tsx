"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, Sparkles } from "lucide-react";
import { StartConfirm } from "@/components/quiz/start-confirm";
import { manifest } from "@/lib/manifest";
import { startQuick } from "@/lib/quiz/quick-start";
import { setSelection } from "@/lib/quiz/selection";
import type { StudyPlan } from "@/lib/study-plan";

type State =
  | { kind: "checking" }
  | { kind: "none" }
  | { kind: "making" }
  | { kind: "ready"; plan: StudyPlan }
  | { kind: "error"; message: string };

/** The AI study plan for one finished quiz. A plan that exists is shown for free; making a new one uses one of the 10 AI requests of the day. */
export function PlanView({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "checking" });
  const [pending, setPending] = useState<{ course: string; unit: number } | null>(null);
  const [startError, setStartError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ai/plan?attemptId=${encodeURIComponent(attemptId)}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) setState({ kind: "ready", plan: ((await res.json()) as { plan: StudyPlan }).plan });
        else setState({ kind: "none" });
      })
      .catch(() => !cancelled && setState({ kind: "error", message: "No connection. The study plan needs the internet." }));
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  async function make() {
    setState({ kind: "making" });
    try {
      const res = await fetch("/api/ai/plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ attemptId }) });
      const data = (await res.json().catch(() => ({}))) as { plan?: StudyPlan; error?: string };
      if (res.ok && data.plan) setState({ kind: "ready", plan: data.plan });
      else if (res.status === 404) setState({ kind: "error", message: "This quiz is still being saved. Wait a moment, open the results page again, and retry." });
      else setState({ kind: "error", message: data.error ?? "The AI helper could not make a plan. Please try again." });
    } catch {
      setState({ kind: "error", message: "No connection. The study plan needs the internet." });
    }
  }

  // the practice button asks first; the quiz starts only when the person agrees
  function startPending() {
    if (!pending) return;
    const sel = { [pending.course]: [pending.unit] };
    setSelection(sel);
    if (startQuick(sel, 10)) router.push("/quiz");
    else setStartError("This quiz could not be built.");
  }

  const topicName = (course: string, unit: number) => {
    const c = manifest.courses.find((x) => x.id === course);
    const u = c?.units.find((x) => x.n === unit);
    return c && u ? `${c.title} · ${u.n}. ${u.title}` : "";
  };

  return (
    <div>
      <div className="relative flex h-12 items-center justify-center">
        <Link href={`/results/${attemptId}`} aria-label="Back to results" className="absolute left-0 flex h-12 w-12 items-center justify-center rounded-option border border-line bg-surface">
          <ChevronLeft size={20} aria-hidden />
        </Link>
        <h1 className="text-lg font-bold">AI study plan</h1>
      </div>

      {state.kind === "checking" && <p className="mt-10 text-center text-soft" role="status">Checking…</p>}

      {(state.kind === "none" || state.kind === "error" || state.kind === "making") && (
        <div className="mt-8 text-center">
          <Sparkles size={32} className="mx-auto text-accent" aria-hidden />
          <p className="mt-3 text-soft">A short plan built from your scores in this quiz.</p>
          <p className="mt-1 text-xs text-soft">Making a plan uses 1 of your 10 AI requests today.</p>
          {state.kind === "error" && <p role="alert" className="mt-3 text-sm font-semibold text-bad">{state.message}</p>}
          <button type="button" onClick={make} disabled={state.kind === "making"} className="mt-5 h-12 rounded-option bg-accent px-6 font-bold text-accent-ink disabled:opacity-60">
            {state.kind === "making" ? "Making your plan…" : "Make my plan"}
          </button>
        </div>
      )}

      {state.kind === "ready" && (
        <div className="mt-5 space-y-6">
          <p className="leading-relaxed">{state.plan.summary}</p>

          {state.plan.focus.length > 0 && (
            <section>
              <h2 className="font-extrabold">Focus on</h2>
              <ul className="mt-2 space-y-2">
                {state.plan.focus.map((f, i) => (
                  <li key={i} className="rounded-card border border-line bg-surface p-3">
                    <p className="text-sm font-bold">{f.topic}</p>
                    <p className="mt-1 text-sm text-soft">{f.why}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="font-extrabold">Your plan</h2>
            <ol className="mt-2 space-y-3">
              {state.plan.days.map((d, i) => (
                <li key={i} className="rounded-card border border-line bg-surface p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-accent">Day {i + 1}</p>
                  <p className="mt-1 font-bold">{d.title}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {d.steps.map((s, j) => (
                      <li key={j}>{s}</li>
                    ))}
                  </ul>
                  {d.topic && topicName(d.topic.course, d.topic.unit) && (
                    <button type="button" onClick={() => { setStartError(""); setPending({ course: d.topic!.course, unit: d.topic!.unit }); }} className="mt-3 h-12 w-full rounded-option bg-accent font-bold text-accent-ink">
                      Start practice · {topicName(d.topic.course, d.topic.unit)}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </section>
          <p className="text-xs text-soft">Made by AI from your quiz scores. It can make mistakes, so use it as a guide.</p>
        </div>
      )}

      {pending && (
        <StartConfirm
          title="Start this practice?"
          lines={[
            { label: "Questions", value: String(Math.min(10, manifest.courses.find((c) => c.id === pending.course)?.units.find((u) => u.n === pending.unit)?.count ?? 10)) },
            { label: "Mode", value: "Practice (instant answers)" },
            { label: "Time", value: "No time limit" },
          ]}
          topics={[topicName(pending.course, pending.unit)]}
          error={startError}
          onClose={() => setPending(null)}
          onStart={startPending}
        />
      )}
    </div>
  );
}
