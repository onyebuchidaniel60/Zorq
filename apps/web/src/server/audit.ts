import { randomUUID } from "node:crypto";
import { auditEvents, type Database } from "@zorq/db";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export async function appendAuditEvent(
  tx: Transaction,
  event: {
    actorWallet?: string | null;
    entityType: string;
    entityId: string;
    action: string;
    details?: Record<string, unknown>;
    requestId?: string;
  },
): Promise<void> {
  await tx.insert(auditEvents).values({
    id: randomUUID(),
    actorWallet: event.actorWallet ?? null,
    entityType: event.entityType,
    entityId: event.entityId,
    action: event.action,
    details: event.details ?? {},
    requestId: event.requestId ?? null,
  });
}
