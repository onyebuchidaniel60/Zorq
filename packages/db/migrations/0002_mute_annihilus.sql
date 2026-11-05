CREATE TABLE "authorization_checks" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"run_id" varchar(36) NOT NULL,
	"round_id" varchar(36) NOT NULL,
	"license_id" varchar(36) NOT NULL,
	"participant_wallet" varchar(42) NOT NULL,
	"allowed" boolean NOT NULL,
	"reason_code" varchar(64) NOT NULL,
	"snapshot_block_number" bigint NOT NULL,
	"snapshot_block_hash" varchar(66) NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_rounds" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"run_id" varchar(36) NOT NULL,
	"round_number" smallint NOT NULL,
	"status" varchar(20) DEFAULT 'authorizing' NOT NULL,
	"snapshot_block_number" bigint,
	"snapshot_block_hash" varchar(66),
	"snapshot_block_timestamp" timestamp with time zone,
	"authorized_count" smallint,
	"aggregated_count" smallint,
	"aggregate_metrics" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_runs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"job_id" varchar(36) NOT NULL,
	"requested_by_wallet" varchar(42) NOT NULL,
	"status" varchar(20) DEFAULT 'queued' NOT NULL,
	"idempotency_key" varchar(128) NOT NULL,
	"total_rounds" smallint DEFAULT 3 NOT NULL,
	"current_round" smallint DEFAULT 0 NOT NULL,
	"final_model_hash" varchar(66),
	"aggregate_metrics" jsonb,
	"failure_code" varchar(64),
	"failure_message" varchar(500),
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "authorization_checks_round_license_idx" ON "authorization_checks" USING btree ("round_id","license_id");--> statement-breakpoint
CREATE INDEX "authorization_checks_run_allowed_idx" ON "authorization_checks" USING btree ("run_id","allowed");--> statement-breakpoint
CREATE UNIQUE INDEX "training_rounds_run_round_idx" ON "training_rounds" USING btree ("run_id","round_number");--> statement-breakpoint
CREATE UNIQUE INDEX "training_runs_idempotency_idx" ON "training_runs" USING btree ("requested_by_wallet","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "training_runs_one_active_per_job_idx" ON "training_runs" USING btree ("job_id") WHERE "training_runs"."status" in ('queued', 'preflight', 'running');--> statement-breakpoint
CREATE INDEX "training_runs_job_created_idx" ON "training_runs" USING btree ("job_id","created_at");