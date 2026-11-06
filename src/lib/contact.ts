// Where people are told to send study material. Shown on the Feedback screen.
export const MATERIAL_EMAIL = "muhammadmoosa6262@gmail.com";

export const FEEDBACK_KINDS = [
  { id: "suggestion", label: "Suggestion" },
  { id: "bug", label: "Something is broken" },
  { id: "question", label: "Wrong or unclear question" },
  { id: "material", label: "I have study material" },
] as const;

export type FeedbackKind = (typeof FEEDBACK_KINDS)[number]["id"] | "quiz";
