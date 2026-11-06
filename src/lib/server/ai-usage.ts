import "server-only";
import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { aiUsage } from "@/db/schema";
import { pkDay } from "@/lib/streak";

/** AI requests per person per day (study plans and new explanations together; explanations already saved do not count). */
export const AI_DAILY_LIMIT = 10;

export async function aiUsedToday(userId: string): Promise<number> {
  const rows = await db.select({ n: aiUsage.count }).from(aiUsage).where(and(eq(aiUsage.userId, userId), eq(aiUsage.day, pkDay(new Date())))).limit(1);
  return rows[0]?.n ?? 0;
}

/** Use one of today's requests. Returns false when the daily limit is already reached. Safe when two requests arrive together. */
export async function takeAiRequest(userId: string): Promise<boolean> {
  const day = pkDay(new Date());
  const rows = await db
    .insert(aiUsage)
    .values({ userId, day, count: 1 })
    .onConflictDoUpdate({ target: [aiUsage.userId, aiUsage.day], set: { count: sql`${aiUsage.count} + 1` }, setWhere: lt(aiUsage.count, AI_DAILY_LIMIT) })
    .returning({ n: aiUsage.count });
  return rows.length > 0;
}

/** Give the request back when the AI failed, so a failure does not cost the person one of their ten. */
export async function refundAiRequest(userId: string): Promise<void> {
  await db
    .update(aiUsage)
    .set({ count: sql`greatest(${aiUsage.count} - 1, 0)` })
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.day, pkDay(new Date()))));
}
