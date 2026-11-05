import { z } from "zod";

export const walletAddressSchema = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
export const bytes32Schema = z.string().regex(/^0x[0-9a-fA-F]{64}$/);
export const txHashSchema = z.string().regex(/^0x[0-9a-fA-F]{64}$/);
export const idempotencyKeySchema = z.string().min(8).max(128);

export const assetDraftSchema = z.object({
  displayName: z.string().trim().min(3).max(80),
  description: z.string().trim().max(500).optional().default(""),
  demoPartitionId: z.coerce.number().int().min(0).max(4),
  idempotencyKey: idempotencyKeySchema,
});

export const jobDraftSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().max(1000).optional().default(""),
  purposeText: z.string().trim().min(20).max(500),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  maxParticipants: z.coerce.number().int().min(2).max(5),
  idempotencyKey: idempotencyKeySchema,
});

export const licenseDraftSchema = z.object({
  assetId: z.string().uuid(),
  jobId: z.string().uuid(),
  validFrom: z.string().datetime({ offset: true }),
  validUntil: z.string().datetime({ offset: true }),
  idempotencyKey: idempotencyKeySchema,
});

export const confirmSchema = z.object({
  txHash: txHashSchema,
  blockHash: txHashSchema.optional(),
});

export const jobStateConfirmSchema = z.object({
  expectedState: z.enum(["open", "paused", "closed"]),
  txHash: txHashSchema,
  blockHash: txHashSchema.optional(),
});

export const internalSnapshotSchema = z.object({
  roundNumber: z.coerce.number().int().min(1).max(3),
});

export const internalEventSchema = z.object({
  type: z.enum(["round_started", "round_completed"]),
  roundNumber: z.coerce.number().int().min(1).max(3).optional(),
  metrics: z.record(z.string(), z.unknown()).optional(),
  authorizedCount: z.coerce.number().int().min(0).max(5).optional(),
  aggregatedCount: z.coerce.number().int().min(0).max(5).optional(),
});

export const internalCompleteSchema = z.object({
  finalModelHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  aggregateMetrics: z.record(z.string(), z.unknown()),
});

export const internalFailSchema = z.object({
  failureCode: z.string().min(1).max(64),
  publicMessage: z.string().min(1).max(500),
});
