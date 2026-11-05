import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import {
  authorizationChecks,
  dataAssets,
  flJobs,
  getDb,
  jobParticipants,
  licenses,
  trainingRounds,
  trainingRuns,
} from "@zorq/db";
import { ApiError } from "../http/api";
import { appendAuditEvent } from "../audit";
import { contractAddress, getPublicClient } from "../chain/contract";
import { ZORQ_REGISTRY_ABI } from "../chain/zorq-registry-abi";
import { getServerEnv } from "../env";
import { startFlRun } from "../fl/client";

const REASONS = [
  "AUTHORIZED",
  "UNKNOWN_LICENSE",
  "WRONG_PARTICIPANT",
  "WRONG_JOB",
  "REVOKED",
  "ASSET_INACTIVE",
  "JOB_NOT_OPEN",
  "NOT_YET_VALID",
  "LICENSE_EXPIRED",
  "JOB_NOT_STARTED",
  "JOB_EXPIRED",
] as const;

export async function startRun(input: {
  jobId: string;
  walletAddress: string;
  idempotencyKey: string;
  requestId: string;
}) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(trainingRuns)
    .where(
      and(
        eq(trainingRuns.requestedByWallet, input.walletAddress),
        eq(trainingRuns.idempotencyKey, input.idempotencyKey),
      ),
    )
    .limit(1);
  if (existing) {
    return existing;
  }

  const [job] = await db
    .select()
    .from(flJobs)
    .where(and(eq(flJobs.id, input.jobId), eq(flJobs.creatorWallet, input.walletAddress)))
    .limit(1);
  if (!job) {
    throw new ApiError(404, "NOT_FOUND", "Job not found.");
  }
  if (job.status !== "open") {
    throw new ApiError(409, "INVALID_INPUT", "The job is not open.");
  }

  const participants = await db
    .select({
      assetId: jobParticipants.assetId,
      licenseId: jobParticipants.licenseId,
      ownerWallet: jobParticipants.ownerWallet,
      partitionId: dataAssets.demoPartitionId,
      licenseStatus: licenses.statusMirror,
    })
    .from(jobParticipants)
    .innerJoin(dataAssets, eq(dataAssets.id, jobParticipants.assetId))
    .innerJoin(licenses, eq(licenses.id, jobParticipants.licenseId))
    .where(eq(jobParticipants.jobId, job.id));

  const eligible = participants.filter((participant) => participant.licenseStatus === "active");
  const distinctAssets = new Set(eligible.map((participant) => participant.assetId));
  if (distinctAssets.size < 2) {
    throw new ApiError(
      422,
      "INSUFFICIENT_AUTHORIZED_PARTICIPANTS",
      "At least two distinct assets with active licenses are required.",
    );
  }

  const id = randomUUID();
  const now = new Date();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(trainingRuns).values({
        id,
        jobId: job.id,
        requestedByWallet: input.walletAddress,
        status: "queued",
        idempotencyKey: input.idempotencyKey,
        totalRounds: 3,
        currentRound: 0,
        createdAt: now,
        updatedAt: now,
      });
      await appendAuditEvent(tx, {
        actorWallet: input.walletAddress,
        entityType: "run",
        entityId: id,
        action: "run.queued",
        requestId: input.requestId,
      });
    });
  } catch (error) {
    if (error instanceof Error && /unique|duplicate/i.test(error.message)) {
      throw new ApiError(409, "RUN_ALREADY_ACTIVE", "A run is already active for this job.");
    }
    throw error;
  }

  try {
    await startFlRun({
      runId: id,
      jobId: job.id,
      totalRounds: 3,
      participants: eligible.map((participant) => ({
        assetId: participant.assetId,
        partitionId: participant.partitionId,
        ownerWallet: participant.ownerWallet,
      })),
    });
    await db
      .update(trainingRuns)
      .set({ status: "preflight", updatedAt: new Date() })
      .where(eq(trainingRuns.id, id));
  } catch (error) {
    await db
      .update(trainingRuns)
      .set({
        status: "failed",
        failureCode: "FL_PROVIDER_UNAVAILABLE",
        failureMessage: "The FL service could not start the run.",
        updatedAt: new Date(),
      })
      .where(eq(trainingRuns.id, id));
    if (error instanceof ApiError) throw error;
    throw new ApiError(503, "FL_PROVIDER_UNAVAILABLE", "The FL service could not start the run.");
  }

  const [run] = await db.select().from(trainingRuns).where(eq(trainingRuns.id, id)).limit(1);
  if (!run) {
    throw new ApiError(500, "INTERNAL_ERROR", "The run could not be created.");
  }
  return run;
}

export async function authorizationSnapshot(input: {
  runId: string;
  roundNumber: number;
  requestId: string;
}) {
  const db = getDb();
  const [run] = await db.select().from(trainingRuns).where(eq(trainingRuns.id, input.runId)).limit(1);
  if (!run) {
    throw new ApiError(404, "NOT_FOUND", "Run not found.");
  }
  if (input.roundNumber !== run.currentRound + 1 || input.roundNumber > run.totalRounds) {
    throw new ApiError(400, "INVALID_INPUT", "The round number is not the next expected round.");
  }

  const [existingRound] = await db
    .select()
    .from(trainingRounds)
    .where(
      and(
        eq(trainingRounds.runId, run.id),
        eq(trainingRounds.roundNumber, input.roundNumber),
      ),
    )
    .limit(1);
  if (existingRound) {
    const checks = await db
      .select()
      .from(authorizationChecks)
      .where(eq(authorizationChecks.roundId, existingRound.id));
    return {
      runId: run.id,
      roundNumber: input.roundNumber,
      snapshot: {
        blockNumber: existingRound.snapshotBlockNumber,
        blockHash: existingRound.snapshotBlockHash,
        blockTimestamp: existingRound.snapshotBlockTimestamp?.toISOString(),
      },
      allowed: checks
        .filter((check) => check.allowed)
        .map((check) => ({
          licenseId: check.licenseId,
          participantWallet: check.participantWallet,
        })),
      denied: checks
        .filter((check) => !check.allowed)
        .map((check) => ({
          licenseId: check.licenseId,
          participantWallet: check.participantWallet,
          reasonCode: check.reasonCode,
        })),
    };
  }

  const [job] = await db.select().from(flJobs).where(eq(flJobs.id, run.jobId)).limit(1);
  if (!job) {
    throw new ApiError(404, "NOT_FOUND", "Job not found.");
  }

  const candidates = await db
    .select({
      assetId: jobParticipants.assetId,
      licenseId: jobParticipants.licenseId,
      ownerWallet: jobParticipants.ownerWallet,
      partitionId: dataAssets.demoPartitionId,
      chainAssetId: dataAssets.chainAssetId,
    })
    .from(jobParticipants)
    .innerJoin(dataAssets, eq(dataAssets.id, jobParticipants.assetId))
    .where(eq(jobParticipants.jobId, job.id));

  const uniqueCandidates = Array.from(
    new Map(candidates.map((candidate) => [candidate.assetId, candidate])).values(),
  );

  const client = getPublicClient();
  const settings = getServerEnv();
  try {
    const head = await client.getBlockNumber();
    const snapshotBlockNumber = head - BigInt(settings.PORTALDOT_CONFIRMATION_DEPTH);
    if (snapshotBlockNumber <= 0n) {
      throw new Error("No confirmed block available");
    }
    const block = await client.getBlock({ blockNumber: snapshotBlockNumber });

    const decisions: Array<{
      licenseId: string;
      participantWallet: string;
      allowed: boolean;
      reasonCode: string;
      tokenId: string;
    }> = [];
    const allowed: Array<Record<string, unknown>> = [];
    const denied: Array<Record<string, unknown>> = [];

    for (const candidate of uniqueCandidates) {
      const [latestDbLicense] = await db
        .select()
        .from(licenses)
        .where(and(eq(licenses.assetId, candidate.assetId), eq(licenses.jobId, job.id)))
        .orderBy(desc(licenses.revision))
        .limit(1);
      const licenseId = latestDbLicense?.id ?? candidate.licenseId;

      const latestToken = await client.readContract({
        address: contractAddress(),
        abi: ZORQ_REGISTRY_ABI,
        functionName: "latestLicenseId",
        args: [candidate.chainAssetId as `0x${string}`, job.chainJobId as `0x${string}`],
        blockNumber: snapshotBlockNumber,
      });

      if (latestToken === 0n) {
        decisions.push({
          licenseId,
          participantWallet: candidate.ownerWallet,
          allowed: false,
          reasonCode: "UNKNOWN_LICENSE",
          tokenId: "0",
        });
        denied.push({
          licenseId,
          assetId: candidate.assetId,
          participantWallet: candidate.ownerWallet,
          partitionId: candidate.partitionId,
          reasonCode: "UNKNOWN_LICENSE",
        });
        continue;
      }

      const result = await client.readContract({
        address: contractAddress(),
        abi: ZORQ_REGISTRY_ABI,
        functionName: "checkAuthorization",
        args: [
          latestToken,
          candidate.ownerWallet as `0x${string}`,
          job.chainJobId as `0x${string}`,
        ],
        blockNumber: snapshotBlockNumber,
      });
      const allowedFlag = Boolean(result[0]);
      const reasonCode = REASONS[Number(result[1])] ?? "UNKNOWN_LICENSE";

      decisions.push({
        licenseId,
        participantWallet: candidate.ownerWallet,
        allowed: allowedFlag,
        reasonCode,
        tokenId: latestToken.toString(),
      });

      if (allowedFlag) {
        allowed.push({
          licenseId,
          assetId: candidate.assetId,
          participantWallet: candidate.ownerWallet,
          partitionId: candidate.partitionId,
          tokenId: latestToken.toString(),
        });
      } else {
        denied.push({
          licenseId,
          assetId: candidate.assetId,
          participantWallet: candidate.ownerWallet,
          partitionId: candidate.partitionId,
          reasonCode,
        });
      }
    }

    const roundId = randomUUID();
    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.insert(trainingRounds).values({
        id: roundId,
        runId: run.id,
        roundNumber: input.roundNumber,
        status: "authorizing",
        snapshotBlockNumber: Number(snapshotBlockNumber),
        snapshotBlockHash: block.hash,
        snapshotBlockTimestamp: new Date(Number(block.timestamp) * 1000),
        authorizedCount: allowed.length,
        aggregatedCount: 0,
        startedAt: now,
        createdAt: now,
      });

      for (const decision of decisions) {
        await tx.insert(authorizationChecks).values({
          id: randomUUID(),
          runId: run.id,
          roundId,
          licenseId: decision.licenseId,
          participantWallet: decision.participantWallet,
          allowed: decision.allowed,
          reasonCode: decision.reasonCode,
          snapshotBlockNumber: Number(snapshotBlockNumber),
          snapshotBlockHash: block.hash,
        });
      }

      await tx
        .update(trainingRuns)
        .set({ status: "running", startedAt: run.startedAt ?? now, updatedAt: now })
        .where(eq(trainingRuns.id, run.id));

      await appendAuditEvent(tx, {
        entityType: "run",
        entityId: run.id,
        action: "run.snapshot_created",
        details: {
          roundNumber: input.roundNumber,
          blockNumber: Number(snapshotBlockNumber),
          allowed: allowed.length,
          denied: denied.length,
        },
        requestId: input.requestId,
      });
    });

    return {
      runId: run.id,
      roundNumber: input.roundNumber,
      snapshot: {
        blockNumber: Number(snapshotBlockNumber),
        blockHash: block.hash,
        blockTimestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
      },
      allowed,
      denied,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(503, "AUTHORIZATION_UNAVAILABLE", "Authorization state is unavailable.");
  }
}

export async function recordRunEvent(input: {
  runId: string;
  type: string;
  roundNumber?: number;
  metrics?: Record<string, unknown>;
  authorizedCount?: number;
  aggregatedCount?: number;
}) {
  const db = getDb();
  const [run] = await db.select().from(trainingRuns).where(eq(trainingRuns.id, input.runId)).limit(1);
  if (!run) throw new ApiError(404, "NOT_FOUND", "Run not found.");
  if (input.type === "round_completed" && input.roundNumber) {
    await db
      .update(trainingRounds)
      .set({
        status: "completed",
        aggregatedCount: input.aggregatedCount ?? 0,
        aggregateMetrics: input.metrics ?? {},
        completedAt: new Date(),
      })
      .where(
        and(
          eq(trainingRounds.runId, run.id),
          eq(trainingRounds.roundNumber, input.roundNumber),
        ),
      );
    await db
      .update(trainingRuns)
      .set({ currentRound: input.roundNumber, updatedAt: new Date() })
      .where(eq(trainingRuns.id, run.id));
  }
  return { ok: true };
}

export async function completeRun(input: {
  runId: string;
  finalModelHash: string;
  aggregateMetrics: Record<string, unknown>;
}) {
  const db = getDb();
  const [run] = await db.select().from(trainingRuns).where(eq(trainingRuns.id, input.runId)).limit(1);
  if (!run) throw new ApiError(404, "NOT_FOUND", "Run not found.");
  if (run.currentRound !== run.totalRounds) {
    throw new ApiError(409, "INVALID_INPUT", "The run has not completed all rounds.");
  }
  await db
    .update(trainingRuns)
    .set({
      status: "completed",
      finalModelHash: input.finalModelHash,
      aggregateMetrics: input.aggregateMetrics,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(trainingRuns.id, run.id));
  return { ok: true };
}

export async function failRun(input: {
  runId: string;
  failureCode: string;
  publicMessage: string;
}) {
  const db = getDb();
  await db
    .update(trainingRuns)
    .set({
      status: "failed",
      failureCode: input.failureCode.slice(0, 64),
      failureMessage: input.publicMessage.slice(0, 500),
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(trainingRuns.id, input.runId));
  return { ok: true };
}

export async function getRunForWallet(runId: string, walletAddress: string) {
  const db = getDb();
  const [run] = await db.select().from(trainingRuns).where(eq(trainingRuns.id, runId)).limit(1);
  if (!run) throw new ApiError(404, "NOT_FOUND", "Run not found.");
  const [job] = await db.select().from(flJobs).where(eq(flJobs.id, run.jobId)).limit(1);
  if (!job) throw new ApiError(404, "NOT_FOUND", "Run not found.");
  const rounds = await db
    .select()
    .from(trainingRounds)
    .where(eq(trainingRounds.runId, run.id))
    .orderBy(trainingRounds.roundNumber);
  const checks = await db
    .select()
    .from(authorizationChecks)
    .where(eq(authorizationChecks.runId, run.id));

  const isCreator = job.creatorWallet.toLowerCase() === walletAddress.toLowerCase();
  const isParticipant = checks.some(
    (check) => check.participantWallet.toLowerCase() === walletAddress.toLowerCase(),
  );
  if (!isCreator && !isParticipant) {
    throw new ApiError(404, "NOT_FOUND", "Run not found.");
  }
  return { run, job, rounds, checks, isCreator };
}
