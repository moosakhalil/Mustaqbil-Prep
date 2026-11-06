import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { profile, seenQuestion, wrongQuestion } from "@/db/schema";
import { seenKey, type SeenMap } from "@/lib/fresh-logic";
import { authed, isResponse, json } from "@/lib/server/api";

const DAY_MS = 86_400_000;

// What "fresh questions first" needs: the person's switch, the questions they have seen (times and last day) and their wrong notebook.
export async function GET(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const [prof, seenRows, wrongRows] = await Promise.all([
    db.select({ f: profile.freshFirst }).from(profile).where(eq(profile.userId, who.userId)).limit(1),
    db
      .select({ id: seenQuestion.questionId, times: seenQuestion.times, last: seenQuestion.lastSeen })
      .from(seenQuestion)
      .where(eq(seenQuestion.userId, who.userId))
      .orderBy(desc(seenQuestion.lastSeen))
      .limit(20_000),
    db.select({ id: wrongQuestion.questionId }).from(wrongQuestion).where(eq(wrongQuestion.userId, who.userId)).limit(2_000),
  ]);
  const seen: SeenMap = {};
  for (const r of seenRows) seen[r.id] = [r.times, Math.floor(r.last.getTime() / DAY_MS)];
  return json({ enabled: prof[0]?.f ?? true, seen, wrong: [...new Set(wrongRows.map((r) => seenKey(r.id)))] });
}
