CREATE TABLE "feature_vote" (
	"user_id" text NOT NULL,
	"feature" text NOT NULL,
	"want" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_vote_user_id_feature_pk" PRIMARY KEY("user_id","feature")
);
--> statement-breakpoint
ALTER TABLE "feature_vote" ADD CONSTRAINT "feature_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;