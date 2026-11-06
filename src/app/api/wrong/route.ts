import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { wrongQuestion } from "@/db/schema";
import { authed, isResponse, json } from "@/lib/server/api";

// The wrong-answer notebook: ids of questions answered wrongly and not yet answered correctly, newest first.
export async function GET(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const rows = await db
    .select({ id: wrongQuestion.questionId })
    .from(wrongQuestion)
    .where(eq(wrongQuestion.userId, who.userId))
    .orderBy(desc(wrongQuestion.updatedAt))
    .limit(500);
  return json({ ids: rows.map((r) => r.id) });
}
