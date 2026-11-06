import { z } from "zod";
import { authed, fail, isResponse, json, readJson } from "@/lib/server/api";
import { AI_DAILY_LIMIT, refundAiRequest, takeAiRequest } from "@/lib/server/ai-usage";
import { FOCUS_SYSTEM, focusPrompt, planFromAnswer, prepareFocus, readFocus, saveFocus, scopeSchema } from "@/lib/server/ai-focus";
import { AiNotConfiguredError, chat } from "@/lib/server/cerebras";

// "What should I study today?": today's saved suggestion for one screen (free), or a new one (one AI request, saved for the day).
export async function GET(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const scope = scopeSchema.safeParse(new URL(req.url).searchParams.get("scope"));
  if (!scope.success) return fail("Bad request");
  const plan = await readFocus(who.userId, scope.data);
  return json({ plan: plan ?? null });
}

export async function POST(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const parsed = z.object({ scope: scopeSchema }).safeParse(await readJson(req, 1_000));
  if (!parsed.success) return fail("Bad request");
  const { scope } = parsed.data;

  const saved = await readFocus(who.userId, scope);
  if (saved) return json({ plan: saved, cached: true });

  const prep = await prepareFocus(who.userId, scope);
  // nothing to go on yet: a plain list of the most repeated topics, no AI request used
  if (!prep.hasData) return json({ plan: prep.fallback, cached: false });

  if (!(await takeAiRequest(who.userId))) return fail(`You have used all ${AI_DAILY_LIMIT} AI requests for today. They reset tomorrow.`, 429);
  try {
    const text = await chat({ system: FOCUS_SYSTEM, user: focusPrompt(prep.lines, prep.options, prep.left, prep.quizzes), maxTokens: 1200, json: true });
    const plan = planFromAnswer(text, prep.options, prep.left);
    if (!plan) throw new Error("bad answer");
    await saveFocus(who.userId, scope, plan);
    return json({ plan, cached: false });
  } catch (e) {
    await refundAiRequest(who.userId);
    if (e instanceof AiNotConfiguredError) return fail("The AI helper is not set up yet.", 503);
    return fail("The AI helper is busy right now. Please try again in a minute.", 503);
  }
}
