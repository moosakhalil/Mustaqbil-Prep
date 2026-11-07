import Link from "next/link";
import { Check, Flame, TrendingDown, TrendingUp } from "lucide-react";
import { WeakRow } from "@/components/home/quick-actions";
import { getProgress } from "@/lib/server/progress";
import { getSession } from "@/lib/session";

export const metadata = { title: "Progress · Mustaqbil Prep" };

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Karachi" });
const nf = new Intl.NumberFormat("en");

/** Scores at or above this line are a pass. */
const PASS = 50;

const SECTION_NAMES: Record<string, string> = { verbal: "Verbal", nonverbal: "Non-verbal", academic: "Academic" };
const sectionName = (s: string) => SECTION_NAMES[s] ?? s.charAt(0).toUpperCase() + s.slice(1);

/** The score trend: a 50% pass line with its label, and a dot on the newest score. */
function TrendChart({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const w = 300;
  const h = 92;
  const padX = 8;
  const padTop = 8;
  const padBottom = 8;
  const y = (v: number) => h - padBottom - (v / 100) * (h - padTop - padBottom);
  const x = (i: number) => (values.length === 1 ? w - padX : padX + (i / (values.length - 1)) * (w - 2 * padX));
  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const last = values.length - 1;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-24 w-full" role="img" aria-label={`Score trend, oldest to newest: ${values.map((v) => v + "%").join(", ")}. The pass line is ${PASS}%.`}>
      <line x1="0" x2={w} y1={y(PASS)} y2={y(PASS)} strokeWidth="1.5" strokeDasharray="4 4" className="stroke-bad" />
      <text x={w - 2} y={y(PASS) - 5} textAnchor="end" fontSize="11" fontWeight="700" className="fill-bad">{PASS}% pass</text>
      {values.length > 1 && <polyline points={pts} fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="stroke-accent" />}
      <circle cx={x(last)} cy={y(values[last])} r="5" className="fill-accent" />
    </svg>
  );
}

const SIDES = [
  { id: "all", label: "All" },
  { id: "academia", label: "Academia" },
  { id: "military", label: "Military" },
] as const;

const chipBase = "inline-flex items-center rounded-full px-2.5 py-0.5 text-note font-semibold";

function TakeQuiz({ href = "/practice" }: { href?: string }) {
  return (
    <Link href={href} className="mt-3 inline-flex h-12 items-center rounded-option bg-accent px-5 font-bold text-accent-ink">
      Take a quiz
    </Link>
  );
}

export default async function ProgressPage({ searchParams }: { searchParams: Promise<{ side?: string }> }) {
  const { side: sideParam } = await searchParams;
  const side = SIDES.some((x) => x.id === sideParam) ? (sideParam as (typeof SIDES)[number]["id"]) : "all";
  const session = await getSession();
  if (!session) {
    return (
      <>
        <h1 className="text-lg font-bold">Progress</h1>
        <p className="mt-3 text-soft">Your score trend, weak topics and history appear here once you sign in and finish a quiz.</p>
        <Link href="/sign-in" className="mt-4 inline-flex h-12 items-center rounded-option bg-accent px-5 font-bold text-accent-ink">Sign in</Link>
      </>
    );
  }

  const p = await getProgress(session.user.id);
  const latest = p.trend.at(-1);
  // military results have a section (verbal, nonverbal, academic); degree quizzes do not
  const history = p.recent.filter((a) => side === "all" || (side === "military") === (a.section !== null));

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Progress</h1>
        <p className="flex items-center gap-1.5 text-note font-bold">
          <Flame size={16} className="text-gold" aria-hidden /> {p.streak} day streak
        </p>
      </div>

      <ul className="mt-4 grid grid-cols-7 gap-1 text-center" aria-label="Last 7 days">
        {p.week.map((d) => (
          <li key={d.day} className="flex flex-col items-center gap-1">
            <span className="text-note font-semibold text-soft">{"SMTWTFS"[new Date(d.day + "T00:00:00Z").getUTCDay()]}</span>
            {d.done ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-ink">
                <Check size={16} aria-label="Quiz done" />
              </span>
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-soft/60">
                <span className="sr-only">No quiz</span>
              </span>
            )}
          </li>
        ))}
      </ul>

      <section className="mt-6 rounded-card border border-line bg-surface p-4" aria-label="Score trend">
        <div className="flex items-baseline justify-between">
          <h2 className="font-extrabold">Score trend</h2>
          {p.change !== null && (
            <p className={`flex items-center gap-1 text-note font-bold ${p.change >= 0 ? "text-ok" : "text-bad"}`}>
              {p.change >= 0 ? <TrendingUp size={16} aria-hidden /> : <TrendingDown size={16} aria-hidden />}
              {p.change >= 0 ? "+" : ""}{p.change} points
            </p>
          )}
        </div>
        {p.trend.length === 0 ? (
          <>
            <p className="mt-2 text-sm text-soft">Finish a quiz to see your trend.</p>
            <TakeQuiz />
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-soft">Latest quiz: <b className="text-text">{latest}%</b> · last {p.trend.length} {p.trend.length === 1 ? "quiz" : "quizzes"}</p>
            <TrendChart values={p.trend} />
          </>
        )}
      </section>

      <ul className="mt-4 grid grid-cols-3 gap-3 text-center" aria-label="Totals">
        {[
          { n: nf.format(p.quizzes), l: "Quizzes" },
          { n: nf.format(p.questionsAnswered), l: "Questions" },
          { n: nf.format(p.toRevise), l: "To revise" },
        ].map((s) => (
          <li key={s.l} className="rounded-card border border-line bg-surface p-3">
            <p className="text-xl font-extrabold tabular-nums">{s.n}</p>
            <p className="text-note font-semibold text-soft">{s.l}</p>
          </li>
        ))}
      </ul>

      {p.weak.length > 0 && (
        <section className="mt-6">
          <h2 className="font-extrabold">Weak topics</h2>
          <p className="text-xs text-soft">Tap one to practise it.</p>
          <div className="mt-2 space-y-2">
            {p.weak.map((w) => (
              <WeakRow key={`${w.course}:${w.unit}`} course={w.course} unit={w.unit} percent={w.percent} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-extrabold">History</h2>
        <nav aria-label="Show" className="mt-2 flex gap-2">
          {SIDES.map((x) => (
            <Link key={x.id} href={x.id === "all" ? "/progress" : `/progress?side=${x.id}`} aria-current={x.id === side ? "page" : undefined} className={`flex h-11.5 items-center rounded-full px-5 text-sm font-bold ${x.id === side ? "bg-accent text-accent-ink" : "bg-line/60 text-soft"}`}>
              {x.label}
            </Link>
          ))}
        </nav>
        {history.length === 0 ? (
          <div className="mt-3">
            <p className="text-sm text-soft">{p.recent.length === 0 ? "No saved quizzes yet." : "Nothing here yet."}</p>
            <TakeQuiz href={side === "military" ? "/practice/military" : "/practice"} />
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {history.map((a) => {
              const pct = Math.round(a.percent);
              return (
                <li key={a.id}>
                  <Link href={`/results/${a.id}`} className="flex min-h-16 items-center justify-between gap-3 px-4 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{a.label}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className={`${chipBase} bg-line/60 text-soft`}>{dateFmt.format(new Date(a.finishedAt))}</span>
                        <span className={`${chipBase} ${a.mode === "exam" ? "bg-accent/15 text-accent" : "bg-line/60 text-soft"}`}>{a.mode === "exam" ? "Exam" : "Practice"}</span>
                        {a.section && <span className={`${chipBase} bg-military/15 text-military`}>{sectionName(a.section)}</span>}
                        <span className="text-note text-soft">{a.correct}/{a.total} correct</span>
                      </span>
                    </span>
                    <span className={`shrink-0 text-lg font-extrabold tabular-nums ${pct >= PASS ? "text-ok" : "text-bad"}`}>{pct}%</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
