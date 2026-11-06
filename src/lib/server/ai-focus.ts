import "server-only";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { aiFocus } from "@/db/schema";
import { daysLeft, focusPlanSchema, type FocusAction, type FocusPlan } from "@/lib/ai-focus";
import { IMPORTANT_TOPICS } from "@/lib/important-topics";
import { manifest } from "@/lib/manifest";
import { MILITARY_COURSES, SECTIONS, isMilitaryCourse, militaryTitle } from "@/lib/military";
import { PASS_MARK } from "@/lib/military-rules";
import { getSectionScores } from "@/lib/server/military";
import { getProfileInfo, getProgress } from "@/lib/server/progress";
import { pkDay } from "@/lib/streak";

export const scopeSchema = z.enum(["home", ...MILITARY_COURSES.map((c) => c.id)] as [string, ...string[]]);

export type FocusOption = { key: string; text: string; action: FocusAction };

export const FOCUS_SYSTEM =
  "You are a friendly study coach for a student preparing for exams and for military initial tests (ICTO, LCC, Navy IT, PAF IT). " +
  "You get the student's numbers and a fixed list of options. Choose the 3 options that will help most today. " +
  "Use ONLY the given options and numbers; never invent scores, topics or keys. Write in simple English. " +
  'Reply with JSON only: {"summary": string (2 short sentences: what is going well, what matters most today; mention the days left if given), ' +
  '"items": [{"pick": string (an option key, each used once), "why": string (one short sentence, under 25 words)}]} with exactly 3 items.';

export async function readFocus(userId: string, scope: string): Promise<FocusPlan | null> {
  const rows = await db
    .select({ plan: aiFocus.plan })
    .from(aiFocus)
    .where(and(eq(aiFocus.userId, userId), eq(aiFocus.day, pkDay(new Date())), eq(aiFocus.scope, scope)))
    .limit(1);
  const parsed = rows[0] ? focusPlanSchema.safeParse(rows[0].plan) : null;
  return parsed?.success ? parsed.data : null;
}

export async function saveFocus(userId: string, scope: string, plan: FocusPlan) {
  await db.insert(aiFocus).values({ userId, day: pkDay(new Date()), scope, plan }).onConflictDoNothing();
}

/** Everything the suggestion is built from: the person's numbers, the fixed options, and the plain list used when there is nothing to go on yet. */
export async function prepareFocus(userId: string, scope: string) {
  const [progress, info] = await Promise.all([getProgress(userId), getProfileInfo(userId)]);
  const left = daysLeft(info.examDate, pkDay(new Date()));
  const options: FocusOption[] = [];
  const lines: string[] = [];

  progress.weak.forEach((w, i) => {
    const c = manifest.courses.find((x) => x.id === w.course);
    const u = c?.units.find((x) => x.n === w.unit);
    if (!c || !u) return;
    options.push({ key: `w${i + 1}`, text: `Practise chapter "${u.title}" of ${c.title}`, action: { kind: "topic", course: w.course, unit: w.unit, label: `${c.title} · ${u.title}` } });
    lines.push(`Degree chapter "${u.title}" (${c.title}): ${w.correct} of ${w.total} correct (${w.percent}%)`);
  });

  const courses = scope === "home" ? (isMilitaryCourse(info.preferredCourse) ? [info.preferredCourse] : []) : isMilitaryCourse(scope) ? [scope] : [];
  let militaryScores = 0;
  for (const course of courses) {
    const scores = await getSectionScores(userId, course);
    for (const s of SECTIONS) {
      const p = scores[s.id];
      if (p !== null) militaryScores++;
      options.push({ key: `m:${course}:${s.id}`, text: `Practise ${s.title} for ${militaryTitle(course)}`, action: { kind: "military", course, section: s.id, label: `${militaryTitle(course)} · ${s.title}` } });
      lines.push(`${militaryTitle(course)} ${s.title}: ${p === null ? "not taken yet" : `${p}% (pass line ${PASS_MARK}%)`}`);
    }
  }

  for (const t of IMPORTANT_TOPICS.slice(0, 4)) {
    options.push({ key: `t:${t.id}`, text: `Quick quiz on ${t.title}, about ${t.share}% of past-paper questions`, action: { kind: "course", course: t.degreeCourse, label: `Quick quiz: ${t.title}` } });
  }

  const hasData = progress.weak.length > 0 || militaryScores > 0;
  return { options, lines, hasData, fallback: fallbackPlan(courses[0] ?? null, left), left, quizzes: progress.quizzes };
}

/** The plain suggestion for someone with no results yet. It uses no AI request. */
export function fallbackPlan(course: string | null, left: number | null): FocusPlan {
  const items: FocusPlan["items"] = [];
  if (course) {
    items.push({
      title: `${militaryTitle(course)} · Verbal`,
      why: "Verbal is the first part of the initial test. Take one practice to see where you stand.",
      action: { kind: "military", course, section: "verbal", label: `${militaryTitle(course)} · Verbal` },
    });
  }
  for (const t of IMPORTANT_TOPICS) {
    if (items.length >= 3) break;
    items.push({ title: `Quick quiz: ${t.title}`, why: `About ${t.share}% of past-paper questions: ${t.covers}.`, action: { kind: "course", course: t.degreeCourse, label: `Quick quiz: ${t.title}` } });
  }
  return {
    summary: `You have no results to go on yet, so start with the topics the past papers repeat most.${left !== null ? ` Your test is in ${left} ${left === 1 ? "day" : "days"}.` : ""}`,
    items,
    ai: false,
    daysLeft: left,
  };
}

function extractJson(text: string): unknown {
  const a = text.indexOf("{");
  const b = text.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try {
    return JSON.parse(text.slice(a, b + 1));
  } catch {
    return null;
  }
}

const reply = z.object({ summary: z.string().min(1), items: z.array(z.object({ pick: z.string(), why: z.string() })).min(1) });

/** Turn the AI's answer into a plan that only uses the options we offered. Null when it cannot be used. */
export function planFromAnswer(text: string, options: FocusOption[], left: number | null): FocusPlan | null {
  const parsed = reply.safeParse(extractJson(text));
  if (!parsed.success) return null;
  const used = new Set<string>();
  const items: FocusPlan["items"] = [];
  for (const it of parsed.data.items) {
    const opt = options.find((o) => o.key === it.pick);
    if (!opt || used.has(opt.key)) continue;
    used.add(opt.key);
    items.push({ title: opt.action.label, why: it.why.slice(0, 300), action: opt.action });
    if (items.length === 3) break;
  }
  if (items.length === 0) return null;
  return { summary: parsed.data.summary.slice(0, 600), items, ai: true, daysLeft: left };
}

export function focusPrompt(lines: string[], options: FocusOption[], left: number | null, quizzes: number) {
  return (
    `Quizzes finished so far: ${quizzes}.\n` +
    (left !== null ? `Days left until the student's real test: ${left}.\n` : "") +
    `Student's numbers:\n${lines.join("\n")}\n\nOptions (choose by key):\n${options.map((o) => `${o.key}: ${o.text}`).join("\n")}`
  );
}
