import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { aiExplanation } from "@/db/schema";
import { findLessonByKey, hasAiHelper, lessonText } from "@/lib/guide";
import { authed, fail, isResponse, json, readJson } from "@/lib/server/api";
import { AI_DAILY_LIMIT, aiLeftToday, refundAiRequest, takeAiRequest } from "@/lib/server/ai-usage";
import { AiNotConfiguredError, chat } from "@/lib/server/cerebras";

const body = z.object({ lessonKey: z.string().min(1).max(80), mode: z.enum(["simpler", "example", "quiz"]) });

const SYSTEM =
  "You help a student prepare for the Pakistani military initial test (Verbal, Non-verbal and Academic parts). " +
  "You are given a lesson written for the student. Stay with what the lesson says and the usual correct method; never contradict the lesson. " +
  "Use simple English and short sentences. Plain text only: no headings, no markdown symbols, no tables. At most 180 words.";

const TASK = {
  simpler: "Explain the lesson's trick again in simpler words, for a student who found it hard. Use one tiny everyday example.",
  example: "Give ONE new worked example of the lesson's trick that is different from the examples in the lesson. Show the working step by step, then the answer. Check the arithmetic twice before you answer.",
  quiz: "Write 3 short practice questions on this lesson, from easy to medium. Then write a line that starts with \"Answers:\" and give each answer with one line of working. Check every answer twice.",
} as const;

// "Simpler", "Another example" and "Quiz me" on a lesson. Only "Simpler" is saved for everyone (it does not change); an example or a quiz is made fresh and uses one of the person's daily requests.
export async function POST(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const parsed = body.safeParse(await readJson(req, 2_000));
  if (!parsed.success) return fail("Bad request");
  const { lessonKey, mode } = parsed.data;
  const lesson = findLessonByKey(lessonKey);
  if (!lesson || !hasAiHelper(lesson)) return fail("Lesson not found", 404);

  const cacheKey = `guide:${lessonKey}:${mode}`;
  if (mode === "simpler") {
    const saved = await db.select().from(aiExplanation).where(eq(aiExplanation.questionId, cacheKey)).limit(1);
    if (saved[0]) return json({ text: saved[0].text, cached: true, left: await aiLeftToday(who.userId) });
  }

  if (!(await takeAiRequest(who.userId))) return fail(`You have used all ${AI_DAILY_LIMIT} AI requests for today. They reset tomorrow.`, 429, { left: 0 });

  try {
    const text = await chat({ system: SYSTEM, user: `${TASK[mode]}\n\n${lessonText(lesson)}`, maxTokens: 1500 });
    if (mode === "simpler") await db.insert(aiExplanation).values({ questionId: cacheKey, text, model: process.env.CEREBRAS_MODEL || "gpt-oss-120b" }).onConflictDoNothing();
    return json({ text, cached: false, left: await aiLeftToday(who.userId) });
  } catch (e) {
    await refundAiRequest(who.userId);
    const left = await aiLeftToday(who.userId);
    if (e instanceof AiNotConfiguredError) return fail("The AI helper is not set up yet.", 503, { left });
    return fail("The AI helper is busy right now. Please try again in a minute.", 503, { left });
  }
}
