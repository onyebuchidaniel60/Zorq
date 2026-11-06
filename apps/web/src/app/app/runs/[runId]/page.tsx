import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SignedOutCard } from "@/components/wallet/signed-out-card";
import { RunLive } from "@/components/runs/run-live";
import { getSessionFromCookies } from "@/server/auth/session";
import { getRunForWallet } from "@/server/domain/runs";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Run monitor" };

export default async function RunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const session = await getSessionFromCookies();
  const { runId } = await params;
  if (!session) {
    return (
      <>
        <PageHeader eyebrow="Federated run" title="Run monitor" description="Connect your wallet to view this run." />
        <SignedOutCard feature="Run monitor" />
      </>
    );
  }
  let result;
  try { result = await getRunForWallet(runId, session.walletAddress); } catch { notFound(); }
  const { run, rounds, checks } = result!;

  return (
    <>
      <PageHeader
        eyebrow="Federated run"
        title="Round authorization monitor"
        description="One confirmed contract snapshot per round, the allowlist used for training and aggregation, and the final model hash."
      />
      <RunLive
        runId={run.id}
        initialRun={{
          id: run.id,
          status: run.status,
          currentRound: run.currentRound,
          totalRounds: run.totalRounds,
          finalModelHash: run.finalModelHash,
          failureCode: run.failureCode,
          failureMessage: run.failureMessage,
          aggregateMetrics: run.aggregateMetrics ?? null,
        }}
        initialRounds={rounds.map((round) => ({
          id: round.id,
          roundNumber: round.roundNumber,
          status: round.status,
          snapshotBlockNumber: round.snapshotBlockNumber,
          snapshotBlockHash: round.snapshotBlockHash,
          authorizedCount: round.authorizedCount,
          aggregatedCount: round.aggregatedCount,
          aggregateMetrics: round.aggregateMetrics ?? null,
        }))}
        initialChecks={checks.map((check) => ({
          roundId: check.roundId,
          licenseId: check.licenseId,
          allowed: check.allowed,
          reasonCode: check.reasonCode,
          snapshotBlockNumber: check.snapshotBlockNumber,
        }))}
      />
    </>
  );
}
