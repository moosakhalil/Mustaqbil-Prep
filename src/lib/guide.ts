// The Study Guide for the military initial test. For now every part is "soon": the screens show a locked "Coming soon" placeholder.
// When a part's content is ready, set it to "live" here and build the real screen in the same place.

export type GuidePartId = "notes" | "verbal" | "nonverbal" | "tips" | "ai";
export type GuideStatus = "soon" | "live";

export const GUIDE_PARTS: Record<GuidePartId, GuideStatus> = {
  notes: "soon",
  verbal: "soon",
  nonverbal: "soon",
  tips: "soon",
  ai: "soon",
};

export const isGuideSoon = (part: GuidePartId): boolean => GUIDE_PARTS[part] === "soon";

/** The parts, in the order the Study guide page lists them. */
export const GUIDE_PART_INFO: { id: GuidePartId; title: string; hint: string }[] = [
  { id: "notes", title: "Study notes", hint: "For the Academic part" },
  { id: "verbal", title: "Verbal tricks", hint: "Formulas and methods" },
  { id: "nonverbal", title: "Non-verbal methods", hint: "How to read picture puzzles" },
  { id: "tips", title: "Exam tips and pass plan", hint: "Time and the pass line" },
  { id: "ai", title: "AI helper on notes", hint: "Simpler, example, quiz me" },
];

export type GuideStartCard = { part: GuidePartId; title: string; hint: string };

/** The "Soon" card shown above the question choices on the start page of a part, or null when that part is live. */
export function guideStartCard(course: string, section: "verbal" | "nonverbal" | "academic"): GuideStartCard | null {
  const card: GuideStartCard =
    section === "verbal"
      ? { part: "verbal", title: "Tricks and formulas", hint: "Days, percentages, speed, ages" }
      : section === "nonverbal"
        ? { part: "nonverbal", title: "How to solve picture puzzles", hint: "6 patterns · 2 minute read" }
        : course === "pma-lc"
          ? { part: "notes", title: "Quick facts for these subjects", hint: "Dates, names and lists" }
          : { part: "notes", title: "Notes for these subjects", hint: "Short notes, topic by topic" };
  return isGuideSoon(card.part) ? card : null;
}
