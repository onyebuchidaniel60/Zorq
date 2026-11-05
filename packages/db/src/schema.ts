import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
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
