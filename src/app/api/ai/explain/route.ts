import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { aiExplanation } from "@/db/schema";
import { authed, fail, isResponse, json, readJson } from "@/lib/server/api";
import { AI_DAILY_LIMIT, refundAiRequest, takeAiRequest } from "@/lib/server/ai-usage";
import { AiNotConfiguredError, chat } from "@/lib/server/cerebras";
import { findQuestion } from "@/lib/server/question-source";

const body = z.object({ questionId: z.string().min(1).max(60) });
const LETTERS = ["A", "B", "C", "D", "E", "F"];

const SYSTEM =
  "You are a patient tutor for software engineering and computer science students. " +
  "You are given a multiple-choice question, its options, the correct answer and the textbook explanation. " +
  "The correct answer is already decided: never change it or doubt it. Explain in simple English why it is correct " +
  "and, in one short line each, why the other options are not. Use plain text, no headings, at most 150 words.";

// "Explain more": a clearer explanation of one question. Saved once for everyone; only new explanations use the person's daily limit.
export async function POST(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const parsed = body.safeParse(await readJson(req, 2_000));
  if (!parsed.success) return fail("Bad request");
  const { questionId } = parsed.data;
  // the past-paper banks are the same for every military course: one saved explanation serves them all
  const cacheKey = questionId.replace(/^mil-academic-(icto|lcc|navy-it|airforce-it)-/, "mil-academic-");

  const saved = await db.select().from(aiExplanation).where(eq(aiExplanation.questionId, cacheKey)).limit(1);
  if (saved[0]) return json({ text: saved[0].text, cached: true });

  const question = await findQuestion(new URL(req.url).origin, questionId);
  if (!question) return fail("Question not found", 404);
  if (question.oimg) return fail("Picture questions have no AI explanation", 400);

  if (!(await takeAiRequest(who.userId))) return fail(`You have used all ${AI_DAILY_LIMIT} AI requests for today. They reset tomorrow.`, 429);

  try {
    const prompt =
      `Question: ${question.q}\n` +
      question.o.map((o, i) => `${LETTERS[i]}. ${o}`).join("\n") +
      `\nCorrect answer: ${LETTERS[question.a]}. ${question.o[question.a]}\nTextbook explanation: ${question.e || "(none)"}`;
    const text = await chat({ system: SYSTEM, user: prompt, maxTokens: 1500 });
    await db.insert(aiExplanation).values({ questionId: cacheKey, text, model: process.env.CEREBRAS_MODEL || "gpt-oss-120b" }).onConflictDoNothing();
    return json({ text, cached: false });
  } catch (e) {
    await refundAiRequest(who.userId);
    if (e instanceof AiNotConfiguredError) return fail("The AI helper is not set up yet.", 503);
    return fail("The AI helper is busy right now. Please try again in a minute.", 503);
  }
}
