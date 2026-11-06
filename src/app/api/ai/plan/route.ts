import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { aiPlan, attempt, attemptUnit } from "@/db/schema";
import { manifest } from "@/lib/manifest";
import { planSchema, type StudyPlan } from "@/lib/study-plan";
import { authed, fail, isResponse, json, readJson } from "@/lib/server/api";
import { AI_DAILY_LIMIT, refundAiRequest, takeAiRequest } from "@/lib/server/ai-usage";
import { AiNotConfiguredError, chat } from "@/lib/server/cerebras";

const body = z.object({ attemptId: z.string().min(8).max(80) });

const SYSTEM =
  "You are a study coach for software engineering students preparing for exams. You get a student's quiz scores per chapter " +
  "(numbers only). Write a short, encouraging, practical plan. Use ONLY the chapters listed; never invent scores. " +
  'Reply with JSON only, in this shape: {"summary": string (2 to 3 sentences on strengths and what to focus on), ' +
  '"focus": [{"topic": string, "why": string}] (the 2 weakest chapters), ' +
  '"days": [{"title": string, "steps": [string] (2 to 3 short steps), "topic": {"course": string, "unit": number}}] (exactly 3 days, ' +
  "each day tied to one listed chapter using its course id and unit number)}.";

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

// Look up the plan already made for a quiz (free, uses no AI request).
export async function GET(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const attemptId = z.string().min(8).max(80).safeParse(new URL(req.url).searchParams.get("attemptId"));
  if (!attemptId.success) return fail("Bad request");
  const rows = await db.select({ plan: aiPlan.plan }).from(aiPlan).where(and(eq(aiPlan.attemptId, attemptId.data), eq(aiPlan.userId, who.userId))).limit(1);
  return rows[0] ? json({ plan: rows[0].plan }) : fail("No plan yet", 404);
}

// AI study plan for one finished quiz, built from that quiz's chapter scores. One plan per quiz, saved; a new plan uses one of the daily requests.
export async function POST(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const parsed = body.safeParse(await readJson(req, 2_000));
  if (!parsed.success) return fail("Bad request");
  const { attemptId } = parsed.data;

  const mine = await db.select({ id: attempt.id, label: attempt.label, percent: attempt.percent }).from(attempt).where(and(eq(attempt.id, attemptId), eq(attempt.userId, who.userId))).limit(1);
  if (!mine[0]) return fail("Quiz not found", 404);

  const saved = await db.select().from(aiPlan).where(eq(aiPlan.attemptId, attemptId)).limit(1);
  if (saved[0]) return json({ plan: saved[0].plan, cached: true });

  const units = await db.select().from(attemptUnit).where(eq(attemptUnit.attemptId, attemptId));
  if (units.length === 0) return fail("This quiz has no chapter scores", 400);

  const rows = units
    .map((u) => {
      const course = manifest.courses.find((c) => c.id === u.course);
      const unit = course?.units.find((x) => x.n === u.unit);
      return { u, course, unit };
    })
    .filter((r) => r.course && r.unit)
    .sort((a, b) => a.u.correct / a.u.total - b.u.correct / b.u.total)
    .slice(0, 12);
  if (rows.length === 0) return fail("No chapters to plan from", 400);

  if (!(await takeAiRequest(who.userId))) return fail(`You have used all ${AI_DAILY_LIMIT} AI requests for today. They reset tomorrow.`, 429);

  try {
    const list = rows
      .map((r) => `course id "${r.u.course}" (${r.course!.title}), unit ${r.u.unit} "${r.unit!.title}": ${r.u.correct} of ${r.u.total} correct (${Math.round((r.u.correct / r.u.total) * 100)}%)`)
      .join("\n");
    const text = await chat({ system: SYSTEM, user: `Overall score: ${Math.round(mine[0].percent)}%.\nChapters, weakest first:\n${list}`, maxTokens: 2500, json: true });
    const plan = planSchema.safeParse(extractJson(text));
    if (!plan.success) throw new Error("bad plan");

    // keep only practice links that point at a chapter that really was in this quiz
    const known = new Set(rows.map((r) => `${r.u.course}:${r.u.unit}`));
    const clean: StudyPlan = { ...plan.data, days: plan.data.days.map((d) => ({ ...d, topic: d.topic && known.has(`${d.topic.course}:${d.topic.unit}`) ? d.topic : null })) };

    await db.insert(aiPlan).values({ attemptId, userId: who.userId, plan: clean }).onConflictDoNothing();
    return json({ plan: clean, cached: false });
  } catch (e) {
    await refundAiRequest(who.userId);
    if (e instanceof AiNotConfiguredError) return fail("The AI helper is not set up yet.", 503);
    return fail("The AI helper is busy right now. Please try again in a minute.", 503);
  }
}
