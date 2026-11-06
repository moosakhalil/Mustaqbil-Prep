import { boolean, index, integer, jsonb, pgTable, primaryKey, real, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

// Everything here belongs to one signed-in user and is deleted with the account.
const userId = () => text("user_id").notNull().references(() => user.id, { onDelete: "cascade" });

/** A finished quiz. `payload` is the snapshot (questions as shown, answers, flags, times) so any result can be reopened and made into a PDF. */
export const attempt = pgTable(
  "attempt",
  {
    id: text("id").primaryKey(),
    userId: userId(),
    label: text("label").notNull(),
    mode: text("mode").notNull(), // practice | exam
    section: text("section"), // verbal | nonverbal | academic (military), otherwise null
    militaryCourse: text("military_course"), // icto | lcc | navy-it | airforce-it, for military sections
    mockId: text("mock_id"), // the parts of one full mock test share it
    startedAt: timestamp("started_at").notNull(),
    finishedAt: timestamp("finished_at").notNull(),
    durationSec: integer("duration_sec").notNull(),
    total: integer("total").notNull(),
    correct: integer("correct").notNull(),
    wrong: integer("wrong").notNull(),
    skipped: integer("skipped").notNull(),
    percent: real("percent").notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("attempt_user_finished_idx").on(t.userId, t.finishedAt)],
);

/** Score per course and chapter of an attempt, kept apart so weak topics can be found with one query. */
export const attemptUnit = pgTable(
  "attempt_unit",
  {
    attemptId: text("attempt_id").notNull().references(() => attempt.id, { onDelete: "cascade" }),
    userId: userId(),
    course: text("course").notNull(),
    unit: integer("unit").notNull(),
    total: integer("total").notNull(),
    correct: integer("correct").notNull(),
  },
  (t) => [primaryKey({ columns: [t.attemptId, t.course, t.unit] }), index("attempt_unit_user_idx").on(t.userId, t.course, t.unit)],
);

export const bookmark = pgTable(
  "bookmark",
  { userId: userId(), questionId: text("question_id").notNull(), createdAt: timestamp("created_at").defaultNow().notNull() },
  (t) => [primaryKey({ columns: [t.userId, t.questionId] })],
);

/** The wrong-answer notebook: a question is added when answered wrongly and removed when answered correctly later. */
export const wrongQuestion = pgTable(
  "wrong_question",
  {
    userId: userId(),
    questionId: text("question_id").notNull(),
    times: integer("times").notNull().default(1),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.questionId] })],
);

export const questionReport = pgTable(
  "question_report",
  {
    id: text("id").primaryKey(),
    userId: userId(),
    questionId: text("question_id").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("question_report_question_idx").on(t.questionId)],
);

export const profile = pgTable("profile", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  /** icto | lcc | navy-it | airforce-it, or null */
  preferredCourse: text("preferred_course"),
  /** The day of the person's real test (YYYY-MM-DD), so the AI can fit its advice to the days left. */
  examDate: text("exam_date"),
  /** "Fresh questions first": new quizzes take questions the person has not seen yet. On by default. */
  freshFirst: boolean("fresh_first").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** One written AI explanation per question, shared by everyone, so a question is explained only once. */
export const aiExplanation = pgTable("ai_explanation", {
  questionId: text("question_id").primaryKey(),
  text: text("text").notNull(),
  model: text("model").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** AI requests used per person per day (day is YYYY-MM-DD in Pakistan time). */
export const aiUsage = pgTable(
  "ai_usage",
  { userId: userId(), day: text("day").notNull(), count: integer("count").notNull().default(0) },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);

/** The AI study plan made for one attempt. */
export const aiPlan = pgTable("ai_plan", {
  attemptId: text("attempt_id").primaryKey().references(() => attempt.id, { onDelete: "cascade" }),
  userId: userId(),
  plan: jsonb("plan").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Academic subjects the owner builds for each military course (Phase 7). */
export const militarySubject = pgTable(
  "military_subject",
  {
    id: text("id").primaryKey(),
    course: text("course").notNull(), // icto | lcc | navy-it | airforce-it
    title: text("title").notNull(),
    position: integer("position").notNull().default(0),
    /** degree = questions come from a degree bank by reference; military = converted military material (a file id) */
    source: text("source").notNull(),
    degreeCourse: text("degree_course"),
    /** Chapter numbers of the degree course; null means the whole bank. */
    units: jsonb("units"),
    militaryFile: text("military_file"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("military_subject_course_idx").on(t.course, t.position)],
);

/** Section counts and times of the real initial test, set by the owner per course (Phase 7). */
export const militaryPattern = pgTable("military_pattern", {
  course: text("course").primaryKey(),
  verbalCount: integer("verbal_count").notNull().default(0),
  verbalMinutes: integer("verbal_minutes").notNull().default(0),
  nonverbalCount: integer("nonverbal_count").notNull().default(0),
  nonverbalMinutes: integer("nonverbal_minutes").notNull().default(0),
  academicCount: integer("academic_count").notNull().default(0),
  academicMinutes: integer("academic_minutes").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** "What should I study today?": the AI's advice for one person, saved per day and per screen (home, or a military course), so asking again is free. */
export const aiFocus = pgTable(
  "ai_focus",
  {
    userId: userId(),
    day: text("day").notNull(),
    scope: text("scope").notNull(),
    plan: jsonb("plan").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day, t.scope] })],
);

/** The AI coach's note about one finished military part or quiz. One per attempt, saved. */
export const aiCoach = pgTable("ai_coach", {
  attemptId: text("attempt_id").primaryKey().references(() => attempt.id, { onDelete: "cascade" }),
  userId: userId(),
  note: jsonb("note").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Every question a person has been shown in a finished quiz (military banks shared by all courses count once), for "fresh questions first". */
export const seenQuestion = pgTable(
  "seen_question",
  {
    userId: userId(),
    questionId: text("question_id").notNull(),
    times: integer("times").notNull().default(1),
    lastSeen: timestamp("last_seen").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.questionId] })],
);

/** What people send from the Feedback screen: a star rating, a message, an idea, a bug, a wrong question, or an offer of study material. The owner reads them in the admin inbox. */
export const feedback = pgTable(
  "feedback",
  {
    id: text("id").primaryKey(),
    userId: userId(),
    /** suggestion | bug | question | material | quiz */
    kind: text("kind").notNull(),
    rating: integer("rating"),
    message: text("message").notNull().default(""),
    link: text("link"),
    /** new | done */
    status: text("status").notNull().default("new"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("feedback_created_idx").on(t.createdAt)],
);

/** "Do you want this feature?" votes (for now: ISSB practice). One vote per person per feature; the owner reads them with the voter's email. */
export const featureVote = pgTable(
  "feature_vote",
  {
    userId: userId(),
    feature: text("feature").notNull(),
    want: boolean("want").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.feature] })],
);
