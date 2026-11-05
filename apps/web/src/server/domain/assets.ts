import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { dataAssets, getDb } from "@zorq/db";
import { ApiError } from "../http/api";
import { appendAuditEvent } from "../audit";
import { findIdempotentResponse, saveIdempotentResponse } from "../idempotency";
import { metadataCommitment, randomBytes32 } from "./canonical";
import { verifyContractEvent } from "../chain/verify";
import { contractAddress } from "../chain/contract";
import { recordChainTransaction } from "./chain-tx";
import { getServerEnv } from "../env";

const ROUTE_KEY = "assets.drafts";

export async function createAssetDraft(input: {
  walletAddress: string;
  displayName: string;
  description: string;
  demoPartitionId: number;
  idempotencyKey: string;
  requestId: string;
}) {
  const db = getDb();
  const existing = await findIdempotentResponse(
    db,
    input.walletAddress,
    ROUTE_KEY,
    input.idempotencyKey,
  );
  if (existing) {
    return existing;
  }

  const partition = await db
    .select({ id: dataAssets.id })
    .from(dataAssets)
    .where(
      and(
        eq(dataAssets.demoPartitionId, input.demoPartitionId),
        inArray(dataAssets.status, ["draft", "pending_chain", "active"]),
      ),
    )
    .limit(1);

  if (partition.length > 0) {
    throw new ApiError(409, "INVALID_INPUT", "That synthetic partition is already in use.");
  }

  const id = randomUUID();
  const chainAssetId = randomBytes32();
  const salt = randomBytes32();
  const commitment = metadataCommitment({
    chainAssetId,
    ownerWallet: input.walletAddress,
    displayName: input.displayName,
    description: input.description || null,
    demoPartitionId: input.demoPartitionId,
    salt,
  });
  const now = new Date();

  const response = {
    assetId: id,
    chainAssetId,
    metadataCommitment: commitment,
    contractAddress: contractAddress(),
    functionName: "registerAsset",
    args: [chainAssetId, commitment],
    status: "draft",
  };

  await db.transaction(async (tx) => {
    await tx.insert(dataAssets).values({
      id,
      chainAssetId,
      ownerWallet: input.walletAddress,
      displayName: input.displayName,
      description: input.description || null,
      demoPartitionId: input.demoPartitionId,
      metadataCommitment: commitment,
      metadataSalt: salt,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
    await saveIdempotentResponse(tx, {
      walletAddress: input.walletAddress,
      routeKey: ROUTE_KEY,
      idempotencyKey: input.idempotencyKey,
      responseBody: response,
    });
    await appendAuditEvent(tx, {
      actorWallet: input.walletAddress,
      entityType: "asset",
      entityId: id,
      action: "asset.draft.created",
      requestId: input.requestId,
    });
  });

  return response;
}

export async function confirmAsset(input: {
  assetId: string;
  walletAddress: string;
  txHash: `0x${string}`;
  blockHash?: `0x${string}`;
  requestId: string;
}) {
  const db = getDb();
  const [asset] = await db
    .select()
    .from(dataAssets)
    .where(and(eq(dataAssets.id, input.assetId), eq(dataAssets.ownerWallet, input.walletAddress)))
    .limit(1);

  if (!asset) {
    throw new ApiError(404, "NOT_FOUND", "Asset not found.");
  }
  if (asset.status === "active" && asset.chainTxHash === input.txHash) {
    return { assetId: asset.id, status: asset.status, txHash: asset.chainTxHash };
  }
  if (asset.status === "deactivated") {
    throw new ApiError(409, "INVALID_INPUT", "This asset is deactivated.");
  }

  const verified = await verifyContractEvent({
    txHash: input.txHash,
    blockHash: input.blockHash,
    eventName: "AssetRegistered",
    args: {
      assetId: asset.chainAssetId,
      owner: input.walletAddress,
      metadataCommitment: asset.metadataCommitment,
    },
    senderWallet: input.walletAddress,
  });

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(dataAssets)
        .set({
          status: "active",
          chainTxHash: verified.txHash,
          chainBlockNumber: verified.blockNumber,
          chainBlockHash: verified.blockHash,
          updatedAt: new Date(),
        })
        .where(and(eq(dataAssets.id, asset.id), eq(dataAssets.status, "draft")));

      await recordChainTransaction(tx, {
        txHash: verified.txHash,
        chainId: getServerEnv().PORTALDOT_CHAIN_ID,
        entityType: "asset",
        entityId: asset.id,
        senderWallet: input.walletAddress,
        eventName: verified.eventName,
        blockNumber: verified.blockNumber,
        blockHash: verified.blockHash,
      });

      await appendAuditEvent(tx, {
        actorWallet: input.walletAddress,
        entityType: "asset",
        entityId: asset.id,
        action: "asset.confirmed",
        details: { blockNumber: verified.blockNumber },
        requestId: input.requestId,
      });
    });
  } catch (error) {
    if (error instanceof Error && /unique|duplicate/i.test(error.message)) {
      throw new ApiError(409, "TX_EVENT_MISMATCH", "That transaction is already linked to another record.");
    }
    throw error;
  }

  return { assetId: asset.id, status: "active", txHash: verified.txHash };
}

export async function deactivateAsset(input: {
  assetId: string;
  walletAddress: string;
  txHash: `0x${string}`;
  blockHash?: `0x${string}`;
  requestId: string;
}) {
  const db = getDb();
  const [asset] = await db
    .select()
    .from(dataAssets)
    .where(and(eq(dataAssets.id, input.assetId), eq(dataAssets.ownerWallet, input.walletAddress)))
    .limit(1);

  if (!asset) {
    throw new ApiError(404, "NOT_FOUND", "Asset not found.");
  }
  if (asset.status === "deactivated") {
    return { assetId: asset.id, status: "deactivated" };
  }

  const verified = await verifyContractEvent({
    txHash: input.txHash,
    blockHash: input.blockHash,
    eventName: "AssetDeactivated",
    args: { assetId: asset.chainAssetId, owner: input.walletAddress },
    senderWallet: input.walletAddress,
  });

  await db.transaction(async (tx) => {
    await tx
      .update(dataAssets)
      .set({ status: "deactivated", deactivatedAt: new Date(), updatedAt: new Date() })
      .where(eq(dataAssets.id, asset.id));
    await recordChainTransaction(tx, {
      txHash: verified.txHash,
      chainId: getServerEnv().PORTALDOT_CHAIN_ID,
      entityType: "asset",
      entityId: asset.id,
      senderWallet: input.walletAddress,
      eventName: verified.eventName,
      blockNumber: verified.blockNumber,
      blockHash: verified.blockHash,
    });
    await appendAuditEvent(tx, {
      actorWallet: input.walletAddress,
      entityType: "asset",
      entityId: asset.id,
      action: "asset.deactivated",
      requestId: input.requestId,
    });
  });

  return { assetId: asset.id, status: "deactivated" };
}

export async function listAssets(walletAddress: string) {
  const db = getDb();
  return db
    .select()
    .from(dataAssets)
    .where(eq(dataAssets.ownerWallet, walletAddress));
}

export async function getAssetForOwner(assetId: string, walletAddress: string) {
  const db = getDb();
  const [asset] = await db
    .select()
    .from(dataAssets)
    .where(and(eq(dataAssets.id, assetId), eq(dataAssets.ownerWallet, walletAddress)))
    .limit(1);
  if (!asset) {
    throw new ApiError(404, "NOT_FOUND", "Asset not found.");
  }
  return asset;
}
