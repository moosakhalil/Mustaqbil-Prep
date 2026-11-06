import { z } from "zod";

/** What a "study today" suggestion can ask the person to do. The server builds these itself from a fixed list, so the AI can only choose, never invent. */
export const focusActionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("topic"), course: z.string(), unit: z.number().int(), label: z.string().max(200) }),
  z.object({ kind: z.literal("course"), course: z.string(), label: z.string().max(200) }),
  z.object({ kind: z.literal("military"), course: z.string(), section: z.enum(["verbal", "nonverbal", "academic"]), label: z.string().max(200) }),
]);
export type FocusAction = z.infer<typeof focusActionSchema>;

export const focusPlanSchema = z.object({
  summary: z.string().max(600),
  items: z.array(z.object({ title: z.string().max(160), why: z.string().max(300), action: focusActionSchema })).max(4),
  /** True when the AI wrote it; false for the simple list shown when the person has no results yet. */
  ai: z.boolean(),
  daysLeft: z.number().int().nullable(),
});
export type FocusPlan = z.infer<typeof focusPlanSchema>;

/** The AI coach's note after a military part or quiz. */
export const coachSchema = z.object({
  message: z.string().max(700),
  tips: z.array(z.string().max(250)).max(5),
  next: z.string().max(250),
});
export type CoachNote = z.infer<typeof coachSchema>;

export const examDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Whole days from today (Pakistan time) to the test day; null when there is no date or it has passed. */
export function daysLeft(examDate: string | null | undefined, todayKey: string): number | null {
  if (!examDate || !examDateSchema.safeParse(examDate).success) return null;
  const ms = Date.parse(examDate + "T00:00:00Z") - Date.parse(todayKey + "T00:00:00Z");
  if (!Number.isFinite(ms)) return null;
  const d = Math.round(ms / 86_400_000);
  return d >= 0 ? d : null;
}
