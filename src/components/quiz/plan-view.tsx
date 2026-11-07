"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Copy, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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

/** The plan as plain text, for pasting into notes or a message. */
function planText(plan: StudyPlan, topicName: (course: string, unit: number) => string): string {
  const lines = ["AI study plan", "", plan.summary];
  if (plan.focus.length > 0) {
    lines.push("", "Focus on");
    for (const f of plan.focus) lines.push(`- ${f.topic}: ${f.why}`);
  }
  plan.days.forEach((d, i) => {
    lines.push("", `Day ${i + 1}: ${d.title}`);
    for (const s of d.steps) lines.push(`- ${s}`);
    const topic = d.topic ? topicName(d.topic.course, d.topic.unit) : "";
    if (topic) lines.push(`Practise: ${topic}`);
  });
  return lines.join("\n");
}

/** Grey shapes shaped like the plan, with a note while the AI works (about 10 seconds) or the saved plan is fetched. */
function PlanSkeleton({ making }: { making: boolean }) {
  return (
    <div className="mt-6 space-y-4" role="status" aria-busy="true" aria-label={making ? "Making your plan" : "Checking for your plan"}>
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-20 w-full rounded-card" />
      <Skeleton className="h-32 w-full rounded-card" />
      <Skeleton className="h-32 w-full rounded-card" />
      <p className="flex items-center justify-center gap-1.5 text-note text-soft">
        <Sparkles size={16} className="text-accent" aria-hidden /> {making ? "Making your plan… about 10 seconds" : "Checking for your plan…"}
      </p>
    </div>
  );
}

/** The AI study plan for one finished quiz. A plan that exists is shown for free; making a new one uses one of the 10 AI requests of the day. */
export function PlanView({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "checking" });
  const [pending, setPending] = useState<{ course: string; unit: number } | null>(null);
  const [startError, setStartError] = useState("");
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");

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

  async function copyPlan(plan: StudyPlan) {
    try {
      await navigator.clipboard.writeText(planText(plan, topicName));
      setCopied("done");
    } catch {
      setCopied("failed");
    }
    setTimeout(() => setCopied("idle"), 2500);
  }

  return (
    <div>
      <div className="relative flex h-12 items-center justify-center">
        <Link href={`/results/${attemptId}`} aria-label="Back to results" className="absolute left-0 flex h-12 w-12 items-center justify-center rounded-option border border-line bg-surface">
          <ChevronLeft size={20} aria-hidden />
        </Link>
        <h1 className="text-lg font-bold">AI study plan</h1>
      </div>

      {(state.kind === "checking" || state.kind === "making") && <PlanSkeleton making={state.kind === "making"} />}

      {(state.kind === "none" || state.kind === "error") && (
        <div className="mt-8 text-center">
          <Sparkles size={32} className="mx-auto text-accent" aria-hidden />
          <p className="mt-3 text-soft">A short plan built from your scores in this quiz.</p>
          <p className="mt-1 text-note text-soft">Making a plan uses 1 of your 10 AI requests today.</p>
          {state.kind === "error" && <p role="alert" className="mt-3 text-sm font-semibold text-bad">{state.message}</p>}
          <button type="button" onClick={make} className="mt-5 h-12 rounded-option bg-accent px-6 font-bold text-accent-ink">
            Make my plan
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
                    <>
                      <p className="mt-3 text-note text-soft">{topicName(d.topic.course, d.topic.unit)}</p>
                      <button
                        type="button"
                        onClick={() => { setStartError(""); setPending({ course: d.topic!.course, unit: d.topic!.unit }); }}
                        aria-label={`Practise now: ${topicName(d.topic.course, d.topic.unit)}`}
                        className="mt-2 flex h-12 w-full items-center justify-center gap-1 rounded-option bg-accent font-bold text-accent-ink"
                      >
                        Practise now <ChevronRight size={18} aria-hidden />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ol>
          </section>
          <div>
            <button type="button" onClick={() => void copyPlan(state.plan)} className="flex h-12 w-full items-center justify-center gap-2 rounded-option border border-line font-bold">
              {copied === "done" ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />} {copied === "done" ? "Copied" : "Copy plan"}
            </button>
            <p role="status" className={`mt-1 text-note font-semibold text-bad ${copied === "failed" ? "" : "sr-only"}`}>{copied === "failed" ? "Could not copy. Please select the text and copy it." : ""}</p>
          </div>
          <p className="text-note text-soft">Made by AI from your quiz scores. It can make mistakes, so use it as a guide.</p>
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
