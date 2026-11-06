import { z } from "zod";
import { db } from "@/db";
import { featureVote } from "@/db/schema";
import { authed, fail, isResponse, json, readJson } from "@/lib/server/api";

const body = z.object({ feature: z.enum(["issb"]), want: z.boolean() });

// Save (or change) the signed-in person's vote on a coming-soon feature.
export async function POST(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const parsed = body.safeParse(await readJson(req, 1_000));
  if (!parsed.success) return fail("Bad request");
  const { feature, want } = parsed.data;
  await db
    .insert(featureVote)
    .values({ userId: who.userId, feature, want })
    .onConflictDoUpdate({ target: [featureVote.userId, featureVote.feature], set: { want, createdAt: new Date() } });
  return json({ ok: true });
}
