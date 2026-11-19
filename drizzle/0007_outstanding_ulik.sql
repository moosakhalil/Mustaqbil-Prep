CREATE TABLE "saved_mock" (
	"user_id" text PRIMARY KEY NOT NULL,
	"mock_id" text NOT NULL,
	"state" jsonb NOT NULL,
	"touched_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_quiz" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"mock_id" text,
	"record" jsonb NOT NULL,
	"activity_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_mock" ADD CONSTRAINT "saved_mock_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_quiz" ADD CONSTRAINT "saved_quiz_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "saved_quiz_user_idx" ON "saved_quiz" USING btree ("user_id","activity_at");