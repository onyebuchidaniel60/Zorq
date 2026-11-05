CREATE TABLE "audit_events" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"actor_wallet" varchar(42),
	"entity_type" varchar(64) NOT NULL,
	"entity_id" varchar(128) NOT NULL,
	"action" varchar(64) NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"request_id" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_nonces" (
	"nonce" varchar(128) PRIMARY KEY NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"ss58_address" varchar(64) NOT NULL,
	"domain" varchar(255) NOT NULL,
	"uri" varchar(512) NOT NULL,
	"chain_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "idempotency_records" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"route_key" varchar(64) NOT NULL,
	"idempotency_key" varchar(128) NOT NULL,
	"response_body" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_buckets" (
	"bucket_key" varchar(128) PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"wallet_address" varchar(42) PRIMARY KEY NOT NULL,
	"ss58_address" varchar(64) NOT NULL,
	"display_name" varchar(80),
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "audit_events_entity_idx" ON "audit_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_events_actor_idx" ON "audit_events" USING btree ("actor_wallet");--> statement-breakpoint
CREATE INDEX "audit_events_created_idx" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "auth_nonces_wallet_created_idx" ON "auth_nonces" USING btree ("wallet_address","created_at");--> statement-breakpoint
CREATE INDEX "auth_nonces_expires_at_idx" ON "auth_nonces" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_records_scope_idx" ON "idempotency_records" USING btree ("wallet_address","route_key","idempotency_key");--> statement-breakpoint
CREATE INDEX "idempotency_records_expires_idx" ON "idempotency_records" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "rate_limit_buckets_updated_idx" ON "rate_limit_buckets" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "users_ss58_address_idx" ON "users" USING btree ("ss58_address");