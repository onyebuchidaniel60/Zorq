import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNotNull, isNull, lt, or } from "drizzle-orm";
import { dataAssets, getDb } from "@zorq/db";
import { ApiError } from "../http/api";
import { appendAuditEvent } from "../audit";
import { findIdempotentResponse, saveIdempotentResponse } from "../idempotency";
import { metadataCommitment, randomBytes32 } from "./canonical";
import { verifyContractEvent } from "../chain/verify";
import { contractAddress } from "../chain/contract";
import { recordChainTransaction } from "./chain-tx";
import { getServerEnv } from "../env";
import { encryptDbUrl, isSupportedExternalDbUrl } from "./external-db";

const ROUTE_KEY = "assets.drafts";
const DRAFT_TTL_MS = 30 * 60 * 1000;

async function cleanupStaleAssetDrafts(): Promise<void> {
  const db = getDb();
  const cutoff = new Date(Date.now() - DRAFT_TTL_MS);
  await db
    .delete(dataAssets)
    .where(
      or(
        and(eq(dataAssets.status, "draft"), lt(dataAssets.createdAt, cutoff)),
        and(eq(dataAssets.status, "pending_chain"), isNull(dataAssets.chainTxHash)),
      ),
    );
}

export async function createAssetDraft(input: {
  walletAddress: string;
  displayName: string;
  description: string;
  dataSource: "demo" | "external";
  demoPartitionId?: number;
  dbUrl?: string;
  dbTable?: string;
  labelColumn?: string;
  idempotencyKey: string;
  requestId: string;
}) {
  const db = getDb();
  await cleanupStaleAssetDrafts();
  const existing = await findIdempotentResponse(
    db,
    input.walletAddress,
    ROUTE_KEY,
    input.idempotencyKey,
  );
  if (existing) {
    return existing;
  }

  const isExternal = input.dataSource === "external";
  const dbTable = input.dbTable?.trim() || null;
  const labelColumn = input.labelColumn?.trim() || "label";
  const demoPartitionId = isExternal ? null : input.demoPartitionId ?? null;

  if (!isExternal) {
    if (demoPartitionId === null) {
      throw new ApiError(400, "INVALID_INPUT", "Choose a data partition.");
    }
    const partition = await db
      .select({ id: dataAssets.id })
      .from(dataAssets)
      .where(
        and(
          eq(dataAssets.demoPartitionId, demoPartitionId),
          inArray(dataAssets.status, ["draft", "pending_chain", "active"]),
        ),
      )
      .limit(1);

    if (partition.length > 0) {
      throw new ApiError(409, "INVALID_INPUT", "That data partition is already in use.");
    }
  } else {
    if (!input.dbUrl || !isSupportedExternalDbUrl(input.dbUrl)) {
      throw new ApiError(400, "INVALID_INPUT", "Enter a PostgreSQL database URL.");
    }
    if (!dbTable) {
      throw new ApiError(400, "INVALID_INPUT", "Enter the external table name.");
    }
  }

  const id = randomUUID();
  const chainAssetId = randomBytes32();
  const salt = randomBytes32();
  const commitment = metadataCommitment({
    chainAssetId,
    ownerWallet: input.walletAddress,
    displayName: input.displayName,
    description: input.description || null,
    dataSource: input.dataSource,
    demoPartitionId,
    dbTable,
    labelColumn,
    salt,
  });
  const encryptedDbUrl = isExternal && input.dbUrl ? encryptDbUrl(input.dbUrl) : null;
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
      dataSource: input.dataSource,
      demoPartitionId,
      dbUrl: encryptedDbUrl,
      dbTable,
      labelColumn: isExternal ? labelColumn : null,
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

export async function markAssetPending(input: {
  assetId: string;
  walletAddress: string;
  txHash: `0x${string}`;
  blockHash: `0x${string}`;
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
    return { assetId: asset.id, status: "active", txHash: input.txHash };
  }
  if (asset.status === "pending_chain" && asset.chainTxHash === input.txHash) {
    return { assetId: asset.id, status: "pending_chain", txHash: input.txHash };
  }
  if (asset.status !== "draft") {
    throw new ApiError(409, "INVALID_INPUT", "This asset is not awaiting a transaction.");
  }
  await db
    .update(dataAssets)
    .set({
      status: "pending_chain",
      chainTxHash: input.txHash,
      chainBlockHash: input.blockHash,
      updatedAt: new Date(),
    })
    .where(and(eq(dataAssets.id, asset.id), eq(dataAssets.status, "draft")));
  return { assetId: asset.id, status: "pending_chain", txHash: input.txHash };
}

export async function deleteAssetDraft(input: {
  assetId: string;
  walletAddress: string;
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
  if (asset.status !== "draft" || asset.chainTxHash) {
    throw new ApiError(409, "INVALID_INPUT", "Only an unsubmitted asset draft can be discarded.");
  }
  await db.transaction(async (tx) => {
    await tx.delete(dataAssets).where(eq(dataAssets.id, asset.id));
    await appendAuditEvent(tx, {
      actorWallet: input.walletAddress,
      entityType: "asset",
      entityId: asset.id,
      action: "asset.draft.discarded",
      requestId: input.requestId,
    });
  });
  return { assetId: asset.id, status: "discarded" };
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
  if (!["draft", "pending_chain"].includes(asset.status)) {
    throw new ApiError(409, "INVALID_INPUT", "This asset is not awaiting confirmation.");
  }
  const txHash = (input.txHash ?? asset.chainTxHash) as `0x${string}` | null;
  if (!txHash) {
    throw new ApiError(400, "INVALID_INPUT", "The asset transaction hash is missing.");
  }

  const verified = await verifyContractEvent({
    txHash,
    blockHash: (input.blockHash ?? asset.chainBlockHash ?? undefined) as `0x${string}` | undefined,
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
        .where(and(eq(dataAssets.id, asset.id), inArray(dataAssets.status, ["draft", "pending_chain"])));

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
  await cleanupStaleAssetDrafts();
  const db = getDb();
  return db
    .select({
      id: dataAssets.id,
      chainAssetId: dataAssets.chainAssetId,
      ownerWallet: dataAssets.ownerWallet,
      displayName: dataAssets.displayName,
      description: dataAssets.description,
      dataSource: dataAssets.dataSource,
      demoPartitionId: dataAssets.demoPartitionId,
      dbTable: dataAssets.dbTable,
      labelColumn: dataAssets.labelColumn,
      status: dataAssets.status,
      chainTxHash: dataAssets.chainTxHash,
      chainBlockNumber: dataAssets.chainBlockNumber,
      chainBlockHash: dataAssets.chainBlockHash,
      createdAt: dataAssets.createdAt,
      updatedAt: dataAssets.updatedAt,
    })
    .from(dataAssets)
    .where(
      and(
        eq(dataAssets.ownerWallet, walletAddress),
        inArray(dataAssets.status, ["pending_chain", "active", "deactivated"]),
      ),
    );
}

export async function listReservedPartitions(): Promise<number[]> {
  await cleanupStaleAssetDrafts();
  const db = getDb();
  const rows = await db
    .selectDistinct({ demoPartitionId: dataAssets.demoPartitionId })
    .from(dataAssets)
    .where(
      and(
        isNotNull(dataAssets.demoPartitionId),
        inArray(dataAssets.status, ["draft", "pending_chain", "active"]),
      ),
    );
  return rows
    .map((row) => row.demoPartitionId)
    .filter((value): value is number => value !== null);
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
