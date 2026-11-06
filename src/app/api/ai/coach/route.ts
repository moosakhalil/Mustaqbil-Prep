import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { aiCoach, attempt, attemptUnit } from "@/db/schema";
import { coachSchema, type CoachNote } from "@/lib/ai-focus";
import { manifest } from "@/lib/manifest";
import { SECTIONS, isMilitaryCourse, militaryTitle } from "@/lib/military";
import { militaryManifest } from "@/lib/military-data";
import { PASS_MARK } from "@/lib/military-rules";
import { authed, fail, isResponse, json, readJson } from "@/lib/server/api";
import { AI_DAILY_LIMIT, refundAiRequest, takeAiRequest } from "@/lib/server/ai-usage";
import { AiNotConfiguredError, chat } from "@/lib/server/cerebras";

const idSchema = z.string().min(8).max(80);

const SYSTEM =
  "You are a kind, practical coach for a student preparing for a military initial test (Verbal, Non-verbal and Academic parts, 50% needed in each). " +
  "You get the numbers of one finished part. Use ONLY these numbers; never invent scores or topics. Write in simple English. " +
  'Reply with JSON only: {"message": string (2 to 3 sentences: say honestly how it went, and encourage), ' +
  '"tips": [string] (exactly 3 short, practical tips for this part), "next": string (one sentence: what to practise next)}.';

// Look up the coach note already made for an attempt (free).
export async function GET(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const id = idSchema.safeParse(new URL(req.url).searchParams.get("attemptId"));
  if (!id.success) return fail("Bad request");
  const rows = await db.select({ note: aiCoach.note }).from(aiCoach).where(and(eq(aiCoach.attemptId, id.data), eq(aiCoach.userId, who.userId))).limit(1);
  const note = rows[0] ? coachSchema.safeParse(rows[0].note) : null;
  return json({ note: note?.success ? note.data : null });
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

function topicName(course: string, unit: number): string | null {
  if (course.startsWith("mil-")) {
    const bank = militaryManifest.banks.find((b) => b.code === course);
    const u = bank?.units.find((x) => x.n === unit);
    return bank && u ? `${bank.title}: ${u.title}` : null;
  }
  const c = manifest.courses.find((x) => x.id === course);
  const u = c?.units.find((x) => x.n === unit);
  return c && u ? `${c.title}: ${u.title}` : null;
}

// The AI coach for one finished military part: how it went and what to practise. One note per attempt, saved.
export async function POST(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const parsed = z.object({ attemptId: idSchema }).safeParse(await readJson(req, 1_000));
  if (!parsed.success) return fail("Bad request");
  const { attemptId } = parsed.data;

  const mine = await db.select().from(attempt).where(and(eq(attempt.id, attemptId), eq(attempt.userId, who.userId))).limit(1);
  const a = mine[0];
  if (!a) return fail("Quiz not found", 404);
  if (!a.section) return fail("The coach is for military parts", 400);

  const saved = await db.select({ note: aiCoach.note }).from(aiCoach).where(eq(aiCoach.attemptId, attemptId)).limit(1);
  const savedNote = saved[0] ? coachSchema.safeParse(saved[0].note) : null;
  if (savedNote?.success) return json({ note: savedNote.data, cached: true });

  const units = await db.select().from(attemptUnit).where(eq(attemptUnit.attemptId, attemptId));
  const topics = units
    .map((u) => ({ name: topicName(u.course, u.unit), correct: u.correct, total: u.total }))
    .filter((t): t is { name: string; correct: number; total: number } => !!t.name)
    .sort((x, y) => x.correct / x.total - y.correct / y.total)
    .slice(0, 8);

  if (!(await takeAiRequest(who.userId))) return fail(`You have used all ${AI_DAILY_LIMIT} AI requests for today. They reset tomorrow.`, 429);
  try {
    const sectionTitle = SECTIONS.find((s) => s.id === a.section)?.title ?? a.section;
    const prompt =
      `Course: ${isMilitaryCourse(a.militaryCourse) ? militaryTitle(a.militaryCourse) : "military"}. Part: ${sectionTitle}. Mode: ${a.mode}.\n` +
      `Score: ${Math.round(a.percent)}% (${a.correct} correct, ${a.wrong} wrong, ${a.skipped} skipped of ${a.total}). Pass line: ${PASS_MARK}%.\n` +
      `Time: ${Math.round(a.durationSec / 60)} minutes in total, about ${Math.round(a.durationSec / Math.max(a.total, 1))} seconds per question.\n` +
      (topics.length ? `Topics, weakest first:\n${topics.map((t) => `${t.name}: ${t.correct} of ${t.total} correct`).join("\n")}` : "No topic breakdown is available.");
    const text = await chat({ system: SYSTEM, user: prompt, maxTokens: 1000, json: true });
    const note = coachSchema.safeParse(extractJson(text));
    if (!note.success) throw new Error("bad note");
    const clean: CoachNote = { ...note.data, tips: note.data.tips.slice(0, 3) };
    await db.insert(aiCoach).values({ attemptId, userId: who.userId, note: clean }).onConflictDoNothing();
    return json({ note: clean, cached: false });
  } catch (e) {
    await refundAiRequest(who.userId);
    if (e instanceof AiNotConfiguredError) return fail("The AI helper is not set up yet.", 503);
    return fail("The AI helper is busy right now. Please try again in a minute.", 503);
  }
}
