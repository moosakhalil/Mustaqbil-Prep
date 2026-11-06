CREATE TABLE "ai_explanation" (
	"question_id" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"model" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_plan" (
	"attempt_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"user_id" text NOT NULL,
	"day" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "ai_usage_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"label" text NOT NULL,
	"mode" text NOT NULL,
	"section" text,
	"started_at" timestamp NOT NULL,
	"finished_at" timestamp NOT NULL,
	"duration_sec" integer NOT NULL,
	"total" integer NOT NULL,
	"correct" integer NOT NULL,
	"wrong" integer NOT NULL,
	"skipped" integer NOT NULL,
	"percent" real NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attempt_unit" (
	"attempt_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course" text NOT NULL,
	"unit" integer NOT NULL,
	"total" integer NOT NULL,
	"correct" integer NOT NULL,
	CONSTRAINT "attempt_unit_attempt_id_course_unit_pk" PRIMARY KEY("attempt_id","course","unit")
);
--> statement-breakpoint
CREATE TABLE "bookmark" (
	"user_id" text NOT NULL,
	"question_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bookmark_user_id_question_id_pk" PRIMARY KEY("user_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "military_pattern" (
	"course" text PRIMARY KEY NOT NULL,
	"verbal_count" integer DEFAULT 0 NOT NULL,
	"verbal_minutes" integer DEFAULT 0 NOT NULL,
	"nonverbal_count" integer DEFAULT 0 NOT NULL,
	"nonverbal_minutes" integer DEFAULT 0 NOT NULL,
	"academic_count" integer DEFAULT 0 NOT NULL,
	"academic_minutes" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "military_subject" (
	"id" text PRIMARY KEY NOT NULL,
	"course" text NOT NULL,
	"title" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"source" text NOT NULL,
	"degree_course" text,
	"units" jsonb,
	"military_file" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"preferred_course" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_report" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"question_id" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wrong_question" (
	"user_id" text NOT NULL,
	"question_id" text NOT NULL,
	"times" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wrong_question_user_id_question_id_pk" PRIMARY KEY("user_id","question_id")
);
--> statement-breakpoint
ALTER TABLE "ai_plan" ADD CONSTRAINT "ai_plan_attempt_id_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_plan" ADD CONSTRAINT "ai_plan_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt" ADD CONSTRAINT "attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_unit" ADD CONSTRAINT "attempt_unit_attempt_id_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_unit" ADD CONSTRAINT "attempt_unit_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_report" ADD CONSTRAINT "question_report_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wrong_question" ADD CONSTRAINT "wrong_question_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attempt_user_finished_idx" ON "attempt" USING btree ("user_id","finished_at");--> statement-breakpoint
CREATE INDEX "attempt_unit_user_idx" ON "attempt_unit" USING btree ("user_id","course","unit");--> statement-breakpoint
CREATE INDEX "military_subject_course_idx" ON "military_subject" USING btree ("course","position");--> statement-breakpoint
CREATE INDEX "question_report_question_idx" ON "question_report" USING btree ("question_id");