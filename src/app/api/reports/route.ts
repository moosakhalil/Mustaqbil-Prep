import { and, count, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { questionReport } from "@/db/schema";
import { newId } from "@/lib/id";
import { authed, fail, isResponse, json, readJson } from "@/lib/server/api";

const body = z.object({ questionId: z.string().min(1).max(60), reason: z.string().trim().min(3).max(500) });
const MAX_PER_DAY = 20;

// "Report this question": a wrong answer key, a typo, or an unclear question. The owner reads them in the database.
export async function POST(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const parsed = body.safeParse(await readJson(req, 4_000));
  if (!parsed.success) return fail("Please say what is wrong (3 to 500 characters)");

  const since = new Date(Date.now() - 86_400_000);
  const [{ n }] = await db
    .select({ n: count() })
    .from(questionReport)
    .where(and(eq(questionReport.userId, who.userId), gte(questionReport.createdAt, since)));
  if (n >= MAX_PER_DAY) return fail("You have sent many reports today. Please try again tomorrow.", 429);

  await db.insert(questionReport).values({ id: newId(), userId: who.userId, questionId: parsed.data.questionId, reason: parsed.data.reason });
  return json({ ok: true }, 201);
}
