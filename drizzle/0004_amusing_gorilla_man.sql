CREATE TABLE "seen_question" (
	"user_id" text NOT NULL,
	"question_id" text NOT NULL,
	"times" integer DEFAULT 1 NOT NULL,
	"last_seen" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "seen_question_user_id_question_id_pk" PRIMARY KEY("user_id","question_id")
);
--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "fresh_first" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "seen_question" ADD CONSTRAINT "seen_question_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;