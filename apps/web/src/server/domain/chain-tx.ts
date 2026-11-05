import { randomUUID } from "node:crypto";
import { chainTransactions, type Database } from "@zorq/db";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export async function recordChainTransaction(
  tx: Transaction,
  input: {
    txHash: string;
    chainId: number;
    entityType: "asset" | "job" | "license";
    entityId: string;
    senderWallet: string;
    eventName: string;
    blockNumber: number;
    blockHash: string;
  },
): Promise<void> {
  await tx.insert(chainTransactions).values({
    id: randomUUID(),
    txHash: input.txHash,
    chainId: input.chainId,
    entityType: input.entityType,
    entityId: input.entityId,
    senderWallet: input.senderWallet,
    eventName: input.eventName,
    blockNumber: input.blockNumber,
    blockHash: input.blockHash,
    status: "confirmed",
  });
}
