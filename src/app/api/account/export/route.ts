import { eq } from "drizzle-orm";
import { db } from "@/db";
import { attempt, bookmark, profile, questionReport, user, wrongQuestion } from "@/db/schema";
import { authed, isResponse } from "@/lib/server/api";

// Everything saved about me, as one JSON file.
export async function GET(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;

  const [me, prof, attempts, marks, wrong, reports] = await Promise.all([
    db.select({ name: user.name, email: user.email, createdAt: user.createdAt }).from(user).where(eq(user.id, who.userId)),
    db.select().from(profile).where(eq(profile.userId, who.userId)),
    db.select().from(attempt).where(eq(attempt.userId, who.userId)),
    db.select().from(bookmark).where(eq(bookmark.userId, who.userId)),
    db.select().from(wrongQuestion).where(eq(wrongQuestion.userId, who.userId)),
    db.select().from(questionReport).where(eq(questionReport.userId, who.userId)),
  ]);

  const data = { exportedAt: new Date().toISOString(), account: me[0], profile: prof[0] ?? null, attempts, bookmarks: marks, wrongNotebook: wrong, reports };
  return new Response(JSON.stringify(data, null, 1), {
    headers: { "content-type": "application/json", "content-disposition": 'attachment; filename="mustaqbil-prep-my-data.json"' },
  });
}
