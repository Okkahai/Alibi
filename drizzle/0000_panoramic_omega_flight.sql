CREATE TABLE "cases" (
	"id" text PRIMARY KEY NOT NULL,
	"seed" text NOT NULL,
	"difficulty" text NOT NULL,
	"truth" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_saves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" text NOT NULL,
	"player_id" text NOT NULL,
	"state" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_saves" ADD CONSTRAINT "game_saves_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;