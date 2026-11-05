import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

const timestamptz = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "date" });

export const users = pgTable(
  "users",
  {
    walletAddress: varchar("wallet_address", { length: 42 }).primaryKey(),
    ss58Address: varchar("ss58_address", { length: 64 }).notNull(),
    displayName: varchar("display_name", { length: 80 }),
    status: varchar("status", { length: 16 }).notNull().default("active"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
    lastSeenAt: timestamptz("last_seen_at").notNull().defaultNow(),
  },
  (table) => [index("users_ss58_address_idx").on(table.ss58Address)],
);

export const authNonces = pgTable(
  "auth_nonces",
  {
    nonce: varchar("nonce", { length: 128 }).primaryKey(),
    walletAddress: varchar("wallet_address", { length: 42 }).notNull(),
    ss58Address: varchar("ss58_address", { length: 64 }).notNull(),
    domain: varchar("domain", { length: 255 }).notNull(),
    uri: varchar("uri", { length: 512 }).notNull(),
    chainId: bigint("chain_id", { mode: "number" }).notNull(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    expiresAt: timestamptz("expires_at").notNull(),
    consumedAt: timestamptz("consumed_at"),
  },
  (table) => [
    index("auth_nonces_wallet_created_idx").on(table.walletAddress, table.createdAt),
    index("auth_nonces_expires_at_idx").on(table.expiresAt),
  ],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    actorWallet: varchar("actor_wallet", { length: 42 }),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: varchar("entity_id", { length: 128 }).notNull(),
    action: varchar("action", { length: 64 }).notNull(),
    details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
    requestId: varchar("request_id", { length: 64 }),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("audit_events_entity_idx").on(table.entityType, table.entityId),
    index("audit_events_actor_idx").on(table.actorWallet),
    index("audit_events_created_idx").on(table.createdAt),
  ],
);

export const idempotencyRecords = pgTable(
  "idempotency_records",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    walletAddress: varchar("wallet_address", { length: 42 }).notNull(),
    routeKey: varchar("route_key", { length: 64 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
    responseBody: jsonb("response_body").$type<Record<string, unknown>>(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    expiresAt: timestamptz("expires_at").notNull(),
  },
  (table) => [
    uniqueIndex("idempotency_records_scope_idx").on(
      table.walletAddress,
      table.routeKey,
      table.idempotencyKey,
    ),
    index("idempotency_records_expires_idx").on(table.expiresAt),
  ],
);

export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    bucketKey: varchar("bucket_key", { length: 128 }).primaryKey(),
    windowStart: timestamptz("window_start").notNull().defaultNow(),
    requestCount: integer("request_count").notNull().default(0),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => [index("rate_limit_buckets_updated_idx").on(table.updatedAt)],
);

export type User = typeof users.$inferSelect;
export type AuthNonce = typeof authNonces.$inferSelect;
export type RateLimitBucket = typeof rateLimitBuckets.$inferSelect;

export const dataAssets = pgTable(
  "data_assets",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    chainAssetId: varchar("chain_asset_id", { length: 66 }).notNull().unique(),
    ownerWallet: varchar("owner_wallet", { length: 42 }).notNull(),
    displayName: varchar("display_name", { length: 80 }).notNull(),
    description: varchar("description", { length: 500 }),
    demoPartitionId: smallint("demo_partition_id").notNull(),
    metadataCommitment: varchar("metadata_commitment", { length: 66 }).notNull(),
    metadataSalt: varchar("metadata_salt", { length: 66 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("draft"),
    chainTxHash: varchar("chain_tx_hash", { length: 66 }),
    chainBlockNumber: bigint("chain_block_number", { mode: "number" }),
    chainBlockHash: varchar("chain_block_hash", { length: 66 }),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
    deactivatedAt: timestamptz("deactivated_at"),
  },
  (table) => [
    index("data_assets_owner_status_idx").on(table.ownerWallet, table.status),
    uniqueIndex("data_assets_active_partition_idx")
      .on(table.demoPartitionId)
      .where(sql`${table.status} = 'active'`),
  ],
);

export const flJobs = pgTable(
  "fl_jobs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    chainJobId: varchar("chain_job_id", { length: 66 }).notNull().unique(),
    creatorWallet: varchar("creator_wallet", { length: 42 }).notNull(),
    title: varchar("title", { length: 100 }).notNull(),
    description: varchar("description", { length: 1000 }),
    purposeText: varchar("purpose_text", { length: 500 }).notNull(),
    purposeHash: varchar("purpose_hash", { length: 66 }).notNull(),
    modelKey: varchar("model_key", { length: 64 }).notNull(),
    modelConfig: jsonb("model_config").$type<Record<string, unknown>>().notNull(),
    modelConfigHash: varchar("model_config_hash", { length: 66 }).notNull(),
    minParticipants: smallint("min_participants").notNull().default(2),
    maxParticipants: smallint("max_participants").notNull(),
    maxRounds: smallint("max_rounds").notNull().default(3),
    startsAt: timestamptz("starts_at").notNull(),
    endsAt: timestamptz("ends_at").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("draft"),
    chainTxHash: varchar("chain_tx_hash", { length: 66 }),
    chainBlockNumber: bigint("chain_block_number", { mode: "number" }),
    chainBlockHash: varchar("chain_block_hash", { length: 66 }),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("fl_jobs_status_window_idx").on(table.status, table.startsAt, table.endsAt),
    index("fl_jobs_creator_idx").on(table.creatorWallet, table.createdAt),
  ],
);

export const licenses = pgTable(
  "licenses",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tokenId: numeric("token_id", { precision: 78, scale: 0 }).unique(),
    assetId: varchar("asset_id", { length: 36 }).notNull(),
    jobId: varchar("job_id", { length: 36 }).notNull(),
    assetOwnerWallet: varchar("asset_owner_wallet", { length: 42 }).notNull(),
    revision: integer("revision").notNull(),
    validFrom: timestamptz("valid_from").notNull(),
    validUntil: timestamptz("valid_until").notNull(),
    statusMirror: varchar("status_mirror", { length: 20 }).notNull().default("pending_chain"),
    revokedAt: timestamptz("revoked_at"),
    chainTxHash: varchar("chain_tx_hash", { length: 66 }),
    chainBlockNumber: bigint("chain_block_number", { mode: "number" }),
    chainBlockHash: varchar("chain_block_hash", { length: 66 }),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("licenses_asset_job_revision_idx").on(table.assetId, table.jobId, table.revision),
    index("licenses_job_status_idx").on(table.jobId, table.statusMirror),
    index("licenses_asset_idx").on(table.assetId, table.createdAt),
    index("licenses_owner_status_idx").on(table.assetOwnerWallet, table.statusMirror),
  ],
);

export const chainTransactions = pgTable(
  "chain_transactions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    txHash: varchar("tx_hash", { length: 66 }).notNull().unique(),
    chainId: bigint("chain_id", { mode: "number" }).notNull(),
    entityType: varchar("entity_type", { length: 20 }).notNull(),
    entityId: varchar("entity_id", { length: 36 }).notNull(),
    senderWallet: varchar("sender_wallet", { length: 42 }).notNull(),
    eventName: varchar("event_name", { length: 64 }).notNull(),
    blockNumber: bigint("block_number", { mode: "number" }).notNull(),
    blockHash: varchar("block_hash", { length: 66 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("confirmed"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("chain_transactions_entity_idx").on(table.entityType, table.entityId),
    index("chain_transactions_sender_idx").on(table.senderWallet),
  ],
);

export const jobParticipants = pgTable(
  "job_participants",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    jobId: varchar("job_id", { length: 36 }).notNull(),
    assetId: varchar("asset_id", { length: 36 }).notNull(),
    licenseId: varchar("license_id", { length: 36 }).notNull(),
    ownerWallet: varchar("owner_wallet", { length: 42 }).notNull(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("job_participants_job_license_idx").on(table.jobId, table.licenseId),
    uniqueIndex("job_participants_job_asset_license_idx").on(
      table.jobId,
      table.assetId,
      table.licenseId,
    ),
  ],
);

export type DataAsset = typeof dataAssets.$inferSelect;
export type FlJob = typeof flJobs.$inferSelect;
export type License = typeof licenses.$inferSelect;
export type ChainTransaction = typeof chainTransactions.$inferSelect;

export const trainingRuns = pgTable(
  "training_runs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    jobId: varchar("job_id", { length: 36 }).notNull(),
    requestedByWallet: varchar("requested_by_wallet", { length: 42 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("queued"),
    idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
    totalRounds: smallint("total_rounds").notNull().default(3),
    currentRound: smallint("current_round").notNull().default(0),
    finalModelHash: varchar("final_model_hash", { length: 66 }),
    aggregateMetrics: jsonb("aggregate_metrics").$type<Record<string, unknown>>(),
    failureCode: varchar("failure_code", { length: 64 }),
    failureMessage: varchar("failure_message", { length: 500 }),
    startedAt: timestamptz("started_at"),
    completedAt: timestamptz("completed_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("training_runs_idempotency_idx").on(
      table.requestedByWallet,
      table.idempotencyKey,
    ),
    uniqueIndex("training_runs_one_active_per_job_idx")
      .on(table.jobId)
      .where(sql`${table.status} in ('queued', 'preflight', 'running')`),
    index("training_runs_job_created_idx").on(table.jobId, table.createdAt),
  ],
);

export const trainingRounds = pgTable(
  "training_rounds",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    runId: varchar("run_id", { length: 36 }).notNull(),
    roundNumber: smallint("round_number").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("authorizing"),
    snapshotBlockNumber: bigint("snapshot_block_number", { mode: "number" }),
    snapshotBlockHash: varchar("snapshot_block_hash", { length: 66 }),
    snapshotBlockTimestamp: timestamptz("snapshot_block_timestamp"),
    authorizedCount: smallint("authorized_count"),
    aggregatedCount: smallint("aggregated_count"),
    aggregateMetrics: jsonb("aggregate_metrics").$type<Record<string, unknown>>(),
    startedAt: timestamptz("started_at"),
    completedAt: timestamptz("completed_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("training_rounds_run_round_idx").on(table.runId, table.roundNumber)],
);

export const authorizationChecks = pgTable(
  "authorization_checks",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    runId: varchar("run_id", { length: 36 }).notNull(),
    roundId: varchar("round_id", { length: 36 }).notNull(),
    licenseId: varchar("license_id", { length: 36 }).notNull(),
    participantWallet: varchar("participant_wallet", { length: 42 }).notNull(),
    allowed: boolean("allowed").notNull(),
    reasonCode: varchar("reason_code", { length: 64 }).notNull(),
    snapshotBlockNumber: bigint("snapshot_block_number", { mode: "number" }).notNull(),
    snapshotBlockHash: varchar("snapshot_block_hash", { length: 66 }).notNull(),
    checkedAt: timestamptz("checked_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("authorization_checks_round_license_idx").on(table.roundId, table.licenseId),
    index("authorization_checks_run_allowed_idx").on(table.runId, table.allowed),
  ],
);
