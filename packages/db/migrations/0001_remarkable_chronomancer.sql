CREATE TABLE "chain_transactions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"tx_hash" varchar(66) NOT NULL,
	"chain_id" bigint NOT NULL,
	"entity_type" varchar(20) NOT NULL,
	"entity_id" varchar(36) NOT NULL,
	"sender_wallet" varchar(42) NOT NULL,
	"event_name" varchar(64) NOT NULL,
	"block_number" bigint NOT NULL,
	"block_hash" varchar(66) NOT NULL,
	"status" varchar(20) DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chain_transactions_tx_hash_unique" UNIQUE("tx_hash")
);
--> statement-breakpoint
CREATE TABLE "data_assets" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"chain_asset_id" varchar(66) NOT NULL,
	"owner_wallet" varchar(42) NOT NULL,
	"display_name" varchar(80) NOT NULL,
	"description" varchar(500),
	"demo_partition_id" smallint NOT NULL,
	"metadata_commitment" varchar(66) NOT NULL,
	"metadata_salt" varchar(66) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"chain_tx_hash" varchar(66),
	"chain_block_number" bigint,
	"chain_block_hash" varchar(66),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deactivated_at" timestamp with time zone,
	CONSTRAINT "data_assets_chain_asset_id_unique" UNIQUE("chain_asset_id")
);
--> statement-breakpoint
CREATE TABLE "fl_jobs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"chain_job_id" varchar(66) NOT NULL,
	"creator_wallet" varchar(42) NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" varchar(1000),
	"purpose_text" varchar(500) NOT NULL,
	"purpose_hash" varchar(66) NOT NULL,
	"model_key" varchar(64) NOT NULL,
	"model_config" jsonb NOT NULL,
	"model_config_hash" varchar(66) NOT NULL,
	"min_participants" smallint DEFAULT 2 NOT NULL,
	"max_participants" smallint NOT NULL,
	"max_rounds" smallint DEFAULT 3 NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"chain_tx_hash" varchar(66),
	"chain_block_number" bigint,
	"chain_block_hash" varchar(66),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fl_jobs_chain_job_id_unique" UNIQUE("chain_job_id")
);
--> statement-breakpoint
CREATE TABLE "job_participants" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"job_id" varchar(36) NOT NULL,
	"asset_id" varchar(36) NOT NULL,
	"license_id" varchar(36) NOT NULL,
	"owner_wallet" varchar(42) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "licenses" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"token_id" numeric(78, 0),
	"asset_id" varchar(36) NOT NULL,
	"job_id" varchar(36) NOT NULL,
	"asset_owner_wallet" varchar(42) NOT NULL,
	"revision" integer NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"status_mirror" varchar(20) DEFAULT 'pending_chain' NOT NULL,
	"revoked_at" timestamp with time zone,
	"chain_tx_hash" varchar(66),
	"chain_block_number" bigint,
	"chain_block_hash" varchar(66),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "licenses_token_id_unique" UNIQUE("token_id")
);
--> statement-breakpoint
CREATE INDEX "chain_transactions_entity_idx" ON "chain_transactions" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "chain_transactions_sender_idx" ON "chain_transactions" USING btree ("sender_wallet");--> statement-breakpoint
CREATE INDEX "data_assets_owner_status_idx" ON "data_assets" USING btree ("owner_wallet","status");--> statement-breakpoint
CREATE UNIQUE INDEX "data_assets_active_partition_idx" ON "data_assets" USING btree ("demo_partition_id") WHERE "data_assets"."status" = 'active';--> statement-breakpoint
CREATE INDEX "fl_jobs_status_window_idx" ON "fl_jobs" USING btree ("status","starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "fl_jobs_creator_idx" ON "fl_jobs" USING btree ("creator_wallet","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "job_participants_job_license_idx" ON "job_participants" USING btree ("job_id","license_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_participants_job_asset_license_idx" ON "job_participants" USING btree ("job_id","asset_id","license_id");--> statement-breakpoint
CREATE UNIQUE INDEX "licenses_asset_job_revision_idx" ON "licenses" USING btree ("asset_id","job_id","revision");--> statement-breakpoint
CREATE INDEX "licenses_job_status_idx" ON "licenses" USING btree ("job_id","status_mirror");--> statement-breakpoint
CREATE INDEX "licenses_asset_idx" ON "licenses" USING btree ("asset_id","created_at");--> statement-breakpoint
CREATE INDEX "licenses_owner_status_idx" ON "licenses" USING btree ("asset_owner_wallet","status_mirror");