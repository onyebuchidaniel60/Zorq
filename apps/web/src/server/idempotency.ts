import { and, eq, gt } from "drizzle-orm";
import { idempotencyRecords, type Database } from "@zorq/db";
import { randomUUID } from "node:crypto";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export async function findIdempotentResponse(
  db: Database,
  walletAddress: string,
  routeKey: string,
  idempotencyKey: string,
): Promise<Record<string, unknown> | null> {
  const [record] = await db
    .select()
    .from(idempotencyRecords)
    .where(
      and(
        eq(idempotencyRecords.walletAddress, walletAddress),
        eq(idempotencyRecords.routeKey, routeKey),
        eq(idempotencyRecords.idempotencyKey, idempotencyKey),
        gt(idempotencyRecords.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return (record?.responseBody as Record<string, unknown> | undefined) ?? null;
}

export async function saveIdempotentResponse(
  tx: Transaction,
  input: {
    walletAddress: string;
    routeKey: string;
    idempotencyKey: string;
    responseBody: Record<string, unknown>;
  },
): Promise<void> {
  await tx.insert(idempotencyRecords).values({
    id: randomUUID(),
    walletAddress: input.walletAddress,
    routeKey: input.routeKey,
    idempotencyKey: input.idempotencyKey,
    responseBody: input.responseBody,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
}
