ALTER TABLE "data_assets" ALTER COLUMN "demo_partition_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "data_assets" ADD COLUMN "data_source" varchar(16) DEFAULT 'demo' NOT NULL;--> statement-breakpoint
ALTER TABLE "data_assets" ADD COLUMN "db_url" text;--> statement-breakpoint
ALTER TABLE "data_assets" ADD COLUMN "db_table" varchar(128);--> statement-breakpoint
ALTER TABLE "data_assets" ADD COLUMN "label_column" varchar(128);