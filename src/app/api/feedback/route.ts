import { and, count, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { newId } from "@/lib/id";
import { authed, fail, isResponse, json, readJson } from "@/lib/server/api";
import { pkDay } from "@/lib/streak";

const MAX_PER_DAY = 5;

const body = z
  .object({
    kind: z.enum(["suggestion", "bug", "question", "material", "quiz"]),
    rating: z.number().int().min(1).max(5).optional(),
    message: z.string().trim().max(1_500).default(""),
    link: z.string().trim().max(300).optional(),
  })
  .refine((b) => b.rating !== undefined || b.message.length >= 5, { message: "empty" })
  .refine((b) => !b.link || /^https?:\/\/\S+$/i.test(b.link), { message: "link" });

// Save one piece of feedback from the signed-in person (at most 5 a day, so nobody can flood the inbox).
export async function POST(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const parsed = body.safeParse(await readJson(req, 6_000));
  if (!parsed.success) {
    const why = parsed.error.issues[0]?.message;
    return fail(why === "link" ? "The link must start with http:// or https://" : "Write a short message or give a star rating");
  }

  const dayStart = new Date(`${pkDay(new Date())}T00:00:00+05:00`);
  const [{ n }] = await db.select({ n: count() }).from(feedback).where(and(eq(feedback.userId, who.userId), gte(feedback.createdAt, dayStart)));
  if (n >= MAX_PER_DAY) return fail("You have sent 5 messages today. Please try again tomorrow.", 429);

  const b = parsed.data;
  await db.insert(feedback).values({ id: newId(), userId: who.userId, kind: b.kind, rating: b.rating ?? null, message: b.message, link: b.link || null });
  return json({ ok: true }, 201);
}
