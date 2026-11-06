import { manifest } from "@/lib/manifest";
import { bankById } from "@/lib/military-data";
import type { Score, Tally } from "@/lib/quiz/score";

export const pct = (t: Tally) => (t.total === 0 ? 0 : Math.round((t.correct / t.total) * 100));

/** Strong / Okay / Weak, shown as a word and a colour (never colour alone). */
export function tone(p: number): { word: string; text: string; bar: string } {
  if (p >= 70) return { word: "Strong", text: "text-ok", bar: "bg-ok" };
  if (p >= 50) return { word: "Okay", text: "text-warn", bar: "bg-warn" };
  return { word: "Weak", text: "text-bad", bar: "bg-bad" };
}

export function Bar({ label, tally }: { label: string; tally: Tally }) {
  const p = pct(tally);
  const t = tone(p);
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="shrink-0 tabular-nums">
          <b>{p}%</b> <span className="text-xs text-soft">{tally.correct}/{tally.total}</span> <span className={`text-xs font-bold ${t.text}`}>{t.word}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${p}%` }} />
      </div>
    </li>
  );
}

/** Degree course title, or the title of a military bank (ids like "mil-verbal"). */
export function courseTitle(id: string): string {
  if (id.startsWith("mil-")) return bankById(id.slice(4))?.title ?? id;
  return manifest.courses.find((c) => c.id === id)?.title ?? id;
}

export function unitTitle(course: string, unit: number): string {
  const units = course.startsWith("mil-") ? bankById(course.slice(4))?.units : manifest.courses.find((c) => c.id === course)?.units;
  const u = units?.find((x) => x.n === unit);
  return u ? `${u.n}. ${u.title}` : `Chapter ${unit}`;
}

/** Chapters of a score as rows, weakest first. */
export function weakestFirst(score: Score) {
  return Object.entries(score.byUnit)
    .map(([key, tally]) => {
      const [course, unit] = [key.slice(0, key.lastIndexOf(":")), Number(key.slice(key.lastIndexOf(":") + 1))];
      return { key, course, unit, tally, label: `${courseTitle(course)} · ${unitTitle(course, unit)}` };
    })
    .sort((a, b) => pct(a.tally) - pct(b.tally) || b.tally.total - a.tally.total);
}
