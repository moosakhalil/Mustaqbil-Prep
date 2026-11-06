import { z } from "zod";

/** The AI study plan: a short summary, the two weakest chapters, and a 3-day plan where each day can open a practice quiz on one chapter. */
export const planSchema = z.object({
  summary: z.string().max(1_200),
  focus: z.array(z.object({ topic: z.string().max(200), why: z.string().max(400) })).max(3),
  days: z
    .array(
      z.object({
        title: z.string().max(200),
        steps: z.array(z.string().max(300)).max(5),
        topic: z.object({ course: z.string(), unit: z.number().int() }).nullable().optional(),
      }),
    )
    .max(5),
});

export type StudyPlan = z.infer<typeof planSchema>;
