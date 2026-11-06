import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNull, lt, or } from "drizzle-orm";
import { flJobs, getDb, jobParticipants } from "@zorq/db";
import { ApiError } from "../http/api";
import { appendAuditEvent } from "../audit";
import { findIdempotentResponse, saveIdempotentResponse } from "../idempotency";
import { MODEL_CONFIG, modelConfigHash, purposeHash, randomBytes32 } from "./canonical";
import { verifyContractEvent } from "../chain/verify";
import { contractAddress } from "../chain/contract";
import { recordChainTransaction } from "./chain-tx";
import { getServerEnv } from "../env";

const ROUTE_KEY = "jobs.drafts";
const DRAFT_TTL_MS = 30 * 60 * 1000;
const STATE_TO_CHAIN = { open: 0, paused: 1, closed: 2 } as const;

async function cleanupStaleJobDrafts(): Promise<void> {
  const db = getDb();
  const cutoff = new Date(Date.now() - DRAFT_TTL_MS);
  await db
    .delete(flJobs)
    .where(
      or(
        and(eq(flJobs.status, "draft"), lt(flJobs.createdAt, cutoff)),
        and(eq(flJobs.status, "pending_chain"), isNull(flJobs.chainTxHash)),
      ),
    );
}

export async function createJobDraft(input: {
  walletAddress: string;
  title: string;
  description: string;
  purposeText: string;
  startsAt: string;
  endsAt: string;
  maxParticipants: number;
  idempotencyKey: string;
  requestId: string;
}) {
  const db = getDb();
  await cleanupStaleJobDrafts();
  const existing = await findIdempotentResponse(
    db,
    input.walletAddress,
    ROUTE_KEY,
    input.idempotencyKey,
  );
  if (existing) {
    return existing;
  }

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (
    Number.isNaN(startsAt.getTime()) ||
    Number.isNaN(endsAt.getTime()) ||
    startsAt >= endsAt ||
    endsAt.getTime() <= Date.now() ||
    endsAt.getTime() - startsAt.getTime() > 30 * 24 * 60 * 60 * 1000
  ) {
    throw new ApiError(400, "INVALID_INPUT", "The job window must be valid and at most 30 days.");
  }

  const id = randomUUID();
  const chainJobId = randomBytes32();
  const purpose = purposeHash(input.purposeText);
  const modelHash = modelConfigHash();
  const now = new Date();

  const response = {
    jobId: id,
    chainJobId,
    purposeHash: purpose,
    modelConfigHash: modelHash,
    modelConfig: MODEL_CONFIG,
    contractAddress: contractAddress(),
    functionName: "createJob",
    args: [
      chainJobId,
      purpose,
      modelHash,
      Math.floor(startsAt.getTime() / 1000),
      Math.floor(endsAt.getTime() / 1000),
      input.maxParticipants,
    ],
    status: "draft",
  };

  await db.transaction(async (tx) => {
    await tx.insert(flJobs).values({
      id,
      chainJobId,
      creatorWallet: input.walletAddress,
      title: input.title,
      description: input.description || null,
      purposeText: input.purposeText,
      purposeHash: purpose,
      modelKey: MODEL_CONFIG.modelKey,
      modelConfig: MODEL_CONFIG,
      modelConfigHash: modelHash,
      minParticipants: 2,
      maxParticipants: input.maxParticipants,
      maxRounds: 3,
      startsAt,
      endsAt,
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
      entityType: "job",
      entityId: id,
      action: "job.draft.created",
      requestId: input.requestId,
    });
  });

  return response;
}

export async function markJobPending(input: {
  jobId: string;
  walletAddress: string;
  txHash: `0x${string}`;
  blockHash: `0x${string}`;
}) {
  const db = getDb();
  const [job] = await db
    .select()
    .from(flJobs)
    .where(and(eq(flJobs.id, input.jobId), eq(flJobs.creatorWallet, input.walletAddress)))
    .limit(1);
  if (!job) {
    throw new ApiError(404, "NOT_FOUND", "Job not found.");
  }
  if (job.status === "open" && job.chainTxHash === input.txHash) {
    return { jobId: job.id, status: "open", txHash: input.txHash };
  }
  if (job.status === "pending_chain" && job.chainTxHash === input.txHash) {
    return { jobId: job.id, status: "pending_chain", txHash: input.txHash };
  }
  if (job.status !== "draft") {
    throw new ApiError(409, "INVALID_INPUT", "This job is not awaiting a transaction.");
  }
  await db
    .update(flJobs)
    .set({
      status: "pending_chain",
      chainTxHash: input.txHash,
      chainBlockHash: input.blockHash,
      updatedAt: new Date(),
    })
    .where(and(eq(flJobs.id, job.id), eq(flJobs.status, "draft")));
  return { jobId: job.id, status: "pending_chain", txHash: input.txHash };
}

export async function deleteJobDraft(input: {
  jobId: string;
  walletAddress: string;
  requestId: string;
}) {
  const db = getDb();
  const [job] = await db
    .select()
    .from(flJobs)
    .where(and(eq(flJobs.id, input.jobId), eq(flJobs.creatorWallet, input.walletAddress)))
    .limit(1);
  if (!job) {
    throw new ApiError(404, "NOT_FOUND", "Job not found.");
  }
  if (job.status !== "draft" || job.chainTxHash) {
    throw new ApiError(409, "INVALID_INPUT", "Only an unsubmitted job draft can be discarded.");
  }
  await db.transaction(async (tx) => {
    await tx.delete(flJobs).where(eq(flJobs.id, job.id));
    await appendAuditEvent(tx, {
      actorWallet: input.walletAddress,
      entityType: "job",
      entityId: job.id,
      action: "job.draft.discarded",
      requestId: input.requestId,
    });
  });
  return { jobId: job.id, status: "discarded" };
}

export async function confirmJob(input: {
  jobId: string;
  walletAddress: string;
  txHash: `0x${string}`;
  blockHash?: `0x${string}`;
  requestId: string;
}) {
  const db = getDb();
  const [job] = await db
    .select()
    .from(flJobs)
    .where(and(eq(flJobs.id, input.jobId), eq(flJobs.creatorWallet, input.walletAddress)))
    .limit(1);
  if (!job) {
    throw new ApiError(404, "NOT_FOUND", "Job not found.");
  }
  if (job.status === "open" && job.chainTxHash === input.txHash) {
    return { jobId: job.id, status: job.status, txHash: job.chainTxHash };
  }
  if (!["draft", "pending_chain"].includes(job.status)) {
    throw new ApiError(409, "INVALID_INPUT", "This job is not awaiting confirmation.");
  }
  const txHash = (input.txHash ?? job.chainTxHash) as `0x${string}` | null;
  if (!txHash) {
    throw new ApiError(400, "INVALID_INPUT", "The job transaction hash is missing.");
  }

  const verified = await verifyContractEvent({
    txHash,
    blockHash: (input.blockHash ?? job.chainBlockHash ?? undefined) as `0x${string}` | undefined,
    eventName: "JobCreated",
    args: {
      jobId: job.chainJobId,
      creator: input.walletAddress,
      purposeHash: job.purposeHash,
      modelConfigHash: job.modelConfigHash,
      startsAt: Math.floor(job.startsAt.getTime() / 1000),
      endsAt: Math.floor(job.endsAt.getTime() / 1000),
    },
    senderWallet: input.walletAddress,
  });

  await db.transaction(async (tx) => {
    await tx
      .update(flJobs)
      .set({
        status: "open",
        chainTxHash: verified.txHash,
        chainBlockNumber: verified.blockNumber,
        chainBlockHash: verified.blockHash,
        updatedAt: new Date(),
      })
      .where(and(eq(flJobs.id, job.id), inArray(flJobs.status, ["draft", "pending_chain"])));
    await recordChainTransaction(tx, {
      txHash: verified.txHash,
      chainId: getServerEnv().PORTALDOT_CHAIN_ID,
      entityType: "job",
      entityId: job.id,
      senderWallet: input.walletAddress,
      eventName: verified.eventName,
      blockNumber: verified.blockNumber,
      blockHash: verified.blockHash,
    });
    await appendAuditEvent(tx, {
      actorWallet: input.walletAddress,
      entityType: "job",
      entityId: job.id,
      action: "job.confirmed",
      requestId: input.requestId,
    });
  });

  return { jobId: job.id, status: "open", txHash: verified.txHash };
}

export async function listJobs() {
  await cleanupStaleJobDrafts();
  const db = getDb();
  const jobs = await db
    .select()
    .from(flJobs)
    .where(inArray(flJobs.status, ["pending_chain", "open", "paused", "closed"]));
  return jobs;
}

export async function getJob(jobId: string, walletAddress: string) {
  const db = getDb();
  const [job] = await db.select().from(flJobs).where(eq(flJobs.id, jobId)).limit(1);
  if (!job) {
    throw new ApiError(404, "NOT_FOUND", "Job not found.");
  }
  const participants = await db
    .select({
      licenseId: jobParticipants.licenseId,
      assetId: jobParticipants.assetId,
      ownerWallet: jobParticipants.ownerWallet,
    })
    .from(jobParticipants)
    .where(eq(jobParticipants.jobId, jobId));

  return {
    job,
    participants,
    isCreator: job.creatorWallet.toLowerCase() === walletAddress.toLowerCase(),
  };
}

export async function confirmJobState(input: {
  jobId: string;
  walletAddress: string;
  txHash: `0x${string}`;
  blockHash?: `0x${string}`;
  expectedState: "open" | "paused" | "closed";
  requestId: string;
}) {
  const db = getDb();
  const [job] = await db
    .select()
    .from(flJobs)
    .where(and(eq(flJobs.id, input.jobId), eq(flJobs.creatorWallet, input.walletAddress)))
    .limit(1);
  if (!job) {
    throw new ApiError(404, "NOT_FOUND", "Job not found.");
  }
  if (job.status === input.expectedState && job.chainTxHash === input.txHash) {
    return { jobId: job.id, status: job.status };
  }

  const verified = await verifyContractEvent({
    txHash: input.txHash,
    blockHash: input.blockHash,
    eventName: "JobStateChanged",
    args: { jobId: job.chainJobId, creator: input.walletAddress, state: STATE_TO_CHAIN[input.expectedState] },
    senderWallet: input.walletAddress,
  });

  await db.transaction(async (tx) => {
    await tx
      .update(flJobs)
      .set({ status: input.expectedState, updatedAt: new Date() })
      .where(eq(flJobs.id, job.id));
    await recordChainTransaction(tx, {
      txHash: verified.txHash,
      chainId: getServerEnv().PORTALDOT_CHAIN_ID,
      entityType: "job",
      entityId: job.id,
      senderWallet: input.walletAddress,
      eventName: verified.eventName,
      blockNumber: verified.blockNumber,
      blockHash: verified.blockHash,
    });
    await appendAuditEvent(tx, {
      actorWallet: input.walletAddress,
      entityType: "job",
      entityId: job.id,
      action: `job.${input.expectedState}`,
      requestId: input.requestId,
    });
  });

  return { jobId: job.id, status: input.expectedState };
}
