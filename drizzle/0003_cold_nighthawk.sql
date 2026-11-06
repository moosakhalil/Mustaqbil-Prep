CREATE TABLE "ai_coach" (
	"attempt_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"note" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_focus" (
	"user_id" text NOT NULL,
	"day" text NOT NULL,
	"scope" text NOT NULL,
	"plan" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_focus_user_id_day_scope_pk" PRIMARY KEY("user_id","day","scope")
);
--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "exam_date" text;--> statement-breakpoint
ALTER TABLE "ai_coach" ADD CONSTRAINT "ai_coach_attempt_id_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_coach" ADD CONSTRAINT "ai_coach_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_focus" ADD CONSTRAINT "ai_focus_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;