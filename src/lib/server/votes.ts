import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { featureVote } from "@/db/schema";

/** The person's vote on a feature: true (wants it), false (does not), or null (has not voted). */
export async function getFeatureVote(userId: string, feature: string): Promise<boolean | null> {
  const rows = await db.select({ w: featureVote.want }).from(featureVote).where(and(eq(featureVote.userId, userId), eq(featureVote.feature, feature))).limit(1);
  return rows[0] ? rows[0].w : null;
}
