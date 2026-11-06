import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, isNull, lt, or } from "drizzle-orm";
import { dataAssets, flJobs, getDb, jobParticipants, licenses } from "@zorq/db";
import { ApiError } from "../http/api";
import { appendAuditEvent } from "../audit";
import { findIdempotentResponse, saveIdempotentResponse } from "../idempotency";
import { verifyContractEvent } from "../chain/verify";
import { contractAddress } from "../chain/contract";
import { recordChainTransaction } from "./chain-tx";
import { getServerEnv } from "../env";

const ROUTE_KEY = "licenses.drafts";
const DRAFT_TTL_MS = 30 * 60 * 1000;

async function cleanupStaleLicenseDrafts(): Promise<void> {
  const db = getDb();
  const cutoff = new Date(Date.now() - DRAFT_TTL_MS);
  await db
    .delete(licenses)
    .where(
      or(
        and(eq(licenses.statusMirror, "draft"), lt(licenses.createdAt, cutoff)),
        and(eq(licenses.statusMirror, "pending_chain"), isNull(licenses.chainTxHash)),
      ),
    );
}

export async function createLicenseDraft(input: {
  walletAddress: string;
  assetId: string;
  jobId: string;
  validFrom: string;
  validUntil: string;
  idempotencyKey: string;
  requestId: string;
}) {
  const db = getDb();
  await cleanupStaleLicenseDrafts();
  const existing = await findIdempotentResponse(
    db,
    input.walletAddress,
    ROUTE_KEY,
    input.idempotencyKey,
  );
  if (existing) {
    return existing;
  }

  const [asset] = await db
    .select()
    .from(dataAssets)
    .where(and(eq(dataAssets.id, input.assetId), eq(dataAssets.ownerWallet, input.walletAddress)))
    .limit(1);
  if (!asset) {
    throw new ApiError(404, "NOT_FOUND", "Asset not found.");
  }
  if (asset.status !== "active") {
    throw new ApiError(409, "INVALID_INPUT", "The asset is not active.");
  }

  const [job] = await db.select().from(flJobs).where(eq(flJobs.id, input.jobId)).limit(1);
  if (!job) {
    throw new ApiError(404, "NOT_FOUND", "Job not found.");
  }
  if (job.status !== "open") {
    throw new ApiError(409, "INVALID_INPUT", "The job is not open.");
  }

  const validFrom = new Date(input.validFrom);
  const validUntil = new Date(input.validUntil);
  if (
    Number.isNaN(validFrom.getTime()) ||
    Number.isNaN(validUntil.getTime()) ||
    validFrom >= validUntil ||
    validFrom.getTime() < Date.now() ||
    validFrom < job.startsAt ||
    validUntil > job.endsAt
  ) {
    throw new ApiError(400, "INVALID_INPUT", "The license window must be inside the job window.");
  }

  const current = await db
    .select()
    .from(licenses)
    .where(and(eq(licenses.assetId, asset.id), eq(licenses.jobId, job.id)))
    .orderBy(desc(licenses.revision))
    .limit(1);

  if (
    current[0] &&
    (current[0].statusMirror === "active" || current[0].statusMirror === "pending_chain")
  ) {
    throw new ApiError(409, "INVALID_INPUT", "An active license already exists for this asset/job pair.");
  }
  if (current[0]?.statusMirror === "draft") {
    await db.delete(licenses).where(eq(licenses.id, current[0].id));
  }

  const revision = (current[0]?.statusMirror === "draft" ? current[0].revision : (current[0]?.revision ?? 0) + 1);
  const id = randomUUID();
  const now = new Date();

  const response = {
    licenseId: id,
    assetId: asset.id,
    jobId: job.id,
    revision,
    contractAddress: contractAddress(),
    functionName: "issueLicense",
    args: [
      asset.chainAssetId,
      job.chainJobId,
      Math.floor(validFrom.getTime() / 1000),
      Math.floor(validUntil.getTime() / 1000),
    ],
    status: "draft",
  };

  await db.transaction(async (tx) => {
    await tx.insert(licenses).values({
      id,
      assetId: asset.id,
      jobId: job.id,
      assetOwnerWallet: input.walletAddress,
      revision,
      validFrom,
      validUntil,
      statusMirror: "draft",
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
      entityType: "license",
      entityId: id,
      action: "license.draft.created",
      requestId: input.requestId,
    });
  });

  return response;
}

export async function markLicensePending(input: {
  licenseId: string;
  walletAddress: string;
  txHash: `0x${string}`;
  blockHash: `0x${string}`;
}) {
  const db = getDb();
  const [license] = await db
    .select()
    .from(licenses)
    .where(and(eq(licenses.id, input.licenseId), eq(licenses.assetOwnerWallet, input.walletAddress)))
    .limit(1);
  if (!license) {
    throw new ApiError(404, "NOT_FOUND", "License not found.");
  }
  if (license.statusMirror === "active" && license.chainTxHash === input.txHash) {
    return { licenseId: license.id, status: "active", txHash: input.txHash };
  }
  if (license.statusMirror === "pending_chain" && license.chainTxHash === input.txHash) {
    return { licenseId: license.id, status: "pending_chain", txHash: input.txHash };
  }
  if (license.statusMirror !== "draft") {
    throw new ApiError(409, "INVALID_INPUT", "This license is not awaiting a transaction.");
  }
  await db
    .update(licenses)
    .set({
      statusMirror: "pending_chain",
      chainTxHash: input.txHash,
      chainBlockHash: input.blockHash,
      updatedAt: new Date(),
    })
    .where(and(eq(licenses.id, license.id), eq(licenses.statusMirror, "draft")));
  return { licenseId: license.id, status: "pending_chain", txHash: input.txHash };
}

export async function deleteLicenseDraft(input: {
  licenseId: string;
  walletAddress: string;
  requestId: string;
}) {
  const db = getDb();
  const [license] = await db
    .select()
    .from(licenses)
    .where(and(eq(licenses.id, input.licenseId), eq(licenses.assetOwnerWallet, input.walletAddress)))
    .limit(1);
  if (!license) {
    throw new ApiError(404, "NOT_FOUND", "License not found.");
  }
  if (license.chainTxHash || !["draft", "pending_chain"].includes(license.statusMirror)) {
    throw new ApiError(409, "INVALID_INPUT", "Only an unsubmitted license draft can be discarded.");
  }
  await db.transaction(async (tx) => {
    await tx.delete(licenses).where(eq(licenses.id, license.id));
    await appendAuditEvent(tx, {
      actorWallet: input.walletAddress,
      entityType: "license",
      entityId: license.id,
      action: "license.draft.discarded",
      requestId: input.requestId,
    });
  });
  return { licenseId: license.id, status: "discarded" };
}

export async function confirmLicense(input: {
  licenseId: string;
  walletAddress: string;
  txHash: `0x${string}`;
  blockHash?: `0x${string}`;
  requestId: string;
}) {
  const db = getDb();
  const [license] = await db
    .select()
    .from(licenses)
    .where(and(eq(licenses.id, input.licenseId), eq(licenses.assetOwnerWallet, input.walletAddress)))
    .limit(1);
  if (!license) {
    throw new ApiError(404, "NOT_FOUND", "License not found.");
  }
  if (license.statusMirror === "active" && license.chainTxHash === input.txHash) {
    return { licenseId: license.id, status: license.statusMirror, tokenId: license.tokenId };
  }
  if (!["draft", "pending_chain"].includes(license.statusMirror)) {
    throw new ApiError(409, "INVALID_INPUT", "This license is not awaiting confirmation.");
  }
  const txHash = (input.txHash ?? license.chainTxHash) as `0x${string}` | null;
  if (!txHash) {
    throw new ApiError(400, "INVALID_INPUT", "The license transaction hash is missing.");
  }

  const [asset] = await db.select().from(dataAssets).where(eq(dataAssets.id, license.assetId)).limit(1);
  const [job] = await db.select().from(flJobs).where(eq(flJobs.id, license.jobId)).limit(1);
  if (!asset || !job) {
    throw new ApiError(404, "NOT_FOUND", "The license asset or job is missing.");
  }

  const verified = await verifyContractEvent({
    txHash,
    blockHash: (input.blockHash ?? license.chainBlockHash ?? undefined) as `0x${string}` | undefined,
    eventName: "LicenseIssued",
    args: {
      assetId: asset.chainAssetId,
      jobId: job.chainJobId,
      owner: input.walletAddress,
      revision: license.revision,
      validFrom: Math.floor(license.validFrom.getTime() / 1000),
      validUntil: Math.floor(license.validUntil.getTime() / 1000),
    },
    senderWallet: input.walletAddress,
  });

  const tokenId = String(verified.args.tokenId ?? "");
  if (!tokenId) {
    throw new ApiError(400, "TX_EVENT_MISMATCH", "The license token ID was not emitted.");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(licenses)
      .set({
        tokenId,
        statusMirror: "active",
        chainTxHash: verified.txHash,
        chainBlockNumber: verified.blockNumber,
        chainBlockHash: verified.blockHash,
        updatedAt: new Date(),
      })
      .where(eq(licenses.id, license.id));

    const existingParticipant = await tx
      .select({ id: jobParticipants.id })
      .from(jobParticipants)
      .where(and(eq(jobParticipants.jobId, job.id), eq(jobParticipants.licenseId, license.id)))
      .limit(1);

    if (existingParticipant.length === 0) {
      await tx.insert(jobParticipants).values({
        id: randomUUID(),
        jobId: job.id,
        assetId: asset.id,
        licenseId: license.id,
        ownerWallet: input.walletAddress,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await recordChainTransaction(tx, {
      txHash: verified.txHash,
      chainId: getServerEnv().PORTALDOT_CHAIN_ID,
      entityType: "license",
      entityId: license.id,
      senderWallet: input.walletAddress,
      eventName: verified.eventName,
      blockNumber: verified.blockNumber,
      blockHash: verified.blockHash,
    });
    await appendAuditEvent(tx, {
      actorWallet: input.walletAddress,
      entityType: "license",
      entityId: license.id,
      action: "license.confirmed",
      details: { tokenId },
      requestId: input.requestId,
    });
  });

  return { licenseId: license.id, status: "active", tokenId };
}

export async function revokeLicense(input: {
  licenseId: string;
  walletAddress: string;
  txHash: `0x${string}`;
  blockHash?: `0x${string}`;
  requestId: string;
}) {
  const db = getDb();
  const [license] = await db
    .select()
    .from(licenses)
    .where(and(eq(licenses.id, input.licenseId), eq(licenses.assetOwnerWallet, input.walletAddress)))
    .limit(1);
  if (!license) {
    throw new ApiError(404, "NOT_FOUND", "License not found.");
  }
  if (license.statusMirror === "revoked") {
    return { licenseId: license.id, status: "revoked" };
  }

  const [asset] = await db.select().from(dataAssets).where(eq(dataAssets.id, license.assetId)).limit(1);
  const [job] = await db.select().from(flJobs).where(eq(flJobs.id, license.jobId)).limit(1);
  if (!asset || !job || !license.tokenId) {
    throw new ApiError(404, "NOT_FOUND", "The license is not confirmed.");
  }

  const verified = await verifyContractEvent({
    txHash: input.txHash,
    blockHash: input.blockHash,
    eventName: "LicenseRevoked",
    args: {
      tokenId: license.tokenId,
      assetId: asset.chainAssetId,
      jobId: job.chainJobId,
      owner: input.walletAddress,
    },
    senderWallet: input.walletAddress,
  });

  await db.transaction(async (tx) => {
    await tx
      .update(licenses)
      .set({
        statusMirror: "revoked",
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(licenses.id, license.id));
    await recordChainTransaction(tx, {
      txHash: verified.txHash,
      chainId: getServerEnv().PORTALDOT_CHAIN_ID,
      entityType: "license",
      entityId: license.id,
      senderWallet: input.walletAddress,
      eventName: verified.eventName,
      blockNumber: verified.blockNumber,
      blockHash: verified.blockHash,
    });
    await appendAuditEvent(tx, {
      actorWallet: input.walletAddress,
      entityType: "license",
      entityId: license.id,
      action: "license.revoked",
      requestId: input.requestId,
    });
  });

  return { licenseId: license.id, status: "revoked" };
}

export async function listLicenses(walletAddress: string) {
  await cleanupStaleLicenseDrafts();
  const db = getDb();
  return db
    .select()
    .from(licenses)
    .where(
      and(
        eq(licenses.assetOwnerWallet, walletAddress),
        inArray(licenses.statusMirror, ["pending_chain", "active", "revoked", "expired"]),
      ),
    );
}

export async function getLicense(licenseId: string, walletAddress: string) {
  const db = getDb();
  const [license] = await db.select().from(licenses).where(eq(licenses.id, licenseId)).limit(1);
  if (!license) {
    throw new ApiError(404, "NOT_FOUND", "License not found.");
  }
  const [job] = await db.select().from(flJobs).where(eq(flJobs.id, license.jobId)).limit(1);
  if (!job) {
    throw new ApiError(404, "NOT_FOUND", "Job not found.");
  }
  const isOwner = license.assetOwnerWallet.toLowerCase() === walletAddress.toLowerCase();
  const isCreator = job.creatorWallet.toLowerCase() === walletAddress.toLowerCase();
  if (!isOwner && !isCreator) {
    throw new ApiError(404, "NOT_FOUND", "License not found.");
  }

  return {
    license,
    job: {
      id: job.id,
      title: job.title,
      description: job.description,
      purposeText: job.purposeText,
      status: job.status,
      startsAt: job.startsAt,
      endsAt: job.endsAt,
    },
    isOwner,
  };
}
