CREATE TABLE "guide_read" (
	"user_id" text NOT NULL,
	"lesson_key" text NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guide_read_user_id_lesson_key_pk" PRIMARY KEY("user_id","lesson_key")
);
--> statement-breakpoint
ALTER TABLE "guide_read" ADD CONSTRAINT "guide_read_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;