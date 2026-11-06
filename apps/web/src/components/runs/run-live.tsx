"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";

type Run = {
  id: string;
  status: string;
  currentRound: number;
  totalRounds: number;
  finalModelHash: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  aggregateMetrics: Record<string, unknown> | null;
};
type Round = {
  id: string;
  roundNumber: number;
  status: string;
  snapshotBlockNumber: number | null;
  snapshotBlockHash: string | null;
  authorizedCount: number | null;
  aggregatedCount: number | null;
  aggregateMetrics: Record<string, unknown> | null;
};
type Check = {
  roundId: string;
  licenseId: string;
  allowed: boolean;
  reasonCode: string;
  snapshotBlockNumber: number;
};

export function RunLive({
  runId,
  initialRun,
  initialRounds,
  initialChecks,
}: {
  runId: string;
  initialRun: Run;
  initialRounds: Round[];
  initialChecks: Check[];
}) {
  const [run, setRun] = useState(initialRun);
  const [rounds, setRounds] = useState(initialRounds);
  const [checks, setChecks] = useState(initialChecks);

  useEffect(() => {
    if (["completed", "failed"].includes(run.status)) return;
    const timer = setInterval(() => {
      fetch(`/api/runs/${runId}`, { cache: "no-store" })
        .then((response) => response.json())
        .then((data: { run: Run; rounds: Round[]; checks: Check[] }) => {
          if (!data?.run || !Array.isArray(data.rounds) || !Array.isArray(data.checks)) {
            return;
          }
          setRun(data.run);
          setRounds(data.rounds);
          setChecks(data.checks);
        })
        .catch(() => undefined);
    }, 3000);
    return () => clearInterval(timer);
  }, [runId, run.status]);

  const tone =
    run.status === "completed" ? "success" : run.status === "failed" ? "danger" : "warning";
  const accuracy = run.aggregateMetrics?.accuracy;
  const loss = run.aggregateMetrics?.loss;

  return (
    <div className="z-stack">
      <section className="z-card z-detail-card">
        <div className="z-card-header z-card-header-tight">
          <div>
            <p className="z-eyebrow">Federated run</p>
            <h2 className="z-title-lg">{run.status}</h2>
            <p className="z-copy mt-1">
              One confirmed authorization snapshot per round. Only the returned
              allowlist trains and aggregates.
            </p>
          </div>
          <StatusBadge tone={tone}>
            {run.status === "completed" ? "3 rounds complete" : run.status}
          </StatusBadge>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[14px] border border-white/10 bg-white/[0.025] p-4">
            <p className="z-eyebrow">Progress</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#f3f5ed]">
              {run.currentRound}
              <span className="text-sm font-normal text-[#727969]"> / {run.totalRounds}</span>
            </p>
          </div>
          <div className="rounded-[14px] border border-white/10 bg-white/[0.025] p-4">
            <p className="z-eyebrow">Accuracy</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#d9ff63]">
              {accuracy ? `${(Number(accuracy) * 100).toFixed(1)}%` : "—"}
            </p>
          </div>
          <div className="rounded-[14px] border border-white/10 bg-white/[0.025] p-4">
            <p className="z-eyebrow">Loss</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#f3f5ed]">
              {loss ? Number(loss).toFixed(4) : "—"}
            </p>
          </div>
        </div>

        {run.finalModelHash ? (
          <div className="mt-4 rounded-[12px] border border-white/10 bg-black/20 p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#727969]">
              Final model hash
            </p>
            <p className="mt-1 break-all font-mono text-[10px] text-[#c9cec0]">
              {run.finalModelHash}
            </p>
          </div>
        ) : null}

        {run.failureCode ? (
          <div className="z-alert z-alert-danger mt-4">
            <span className="z-alert-mark">!</span>
            <p>
              {run.failureCode}: {run.failureMessage}
            </p>
          </div>
        ) : null}
      </section>

      <section className="z-card z-detail-card">
        <div className="z-card-header z-card-header-tight">
          <div>
            <p className="z-eyebrow">Authorization evidence</p>
            <h2 className="z-title-md">Round snapshots</h2>
          </div>
          <span className="z-chip z-chip-muted">{rounds.length} rounds recorded</span>
        </div>

        {rounds.length === 0 ? (
          <p className="z-copy">
            No rounds recorded yet. The coordinator is preparing the first
            authorization snapshot.
          </p>
        ) : (
          <div>
            {rounds.map((round) => {
              const roundChecks = checks.filter((check) => check.roundId === round.id);
              const failedParticipants = Array.isArray(
                round.aggregateMetrics?.failedParticipants,
              )
                ? (round.aggregateMetrics.failedParticipants as Array<Record<string, unknown>>)
                : [];
              return (
                <article key={round.id} className="z-round-card">
                  <div className="z-round-head">
                    <p className="z-round-title">Round {round.roundNumber}</p>
                    <StatusBadge tone={round.status === "completed" ? "success" : "warning"}>
                      {round.status}
                    </StatusBadge>
                  </div>
                  <div className="z-round-grid">
                    <p>
                      Snapshot block{" "}
                      <code>{round.snapshotBlockNumber ?? "—"}</code>
                    </p>
                    <p className="break-all">
                      Hash <code>{round.snapshotBlockHash ?? "—"}</code>
                    </p>
                    <p>
                      Authorized <strong className="text-[#f3f5ed]">{round.authorizedCount ?? 0}</strong>{" "}
                      · Aggregated{" "}
                      <strong className="text-[#f3f5ed]">{round.aggregatedCount ?? 0}</strong>
                    </p>
                    <p>
                      Loss{" "}
                      {round.aggregateMetrics?.loss
                        ? Number(round.aggregateMetrics.loss).toFixed(4)
                        : "—"}{" "}
                      · Accuracy{" "}
                      {round.aggregateMetrics?.accuracy
                        ? `${(Number(round.aggregateMetrics.accuracy) * 100).toFixed(1)}%`
                        : "—"}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {roundChecks.map((check) => (
                      <span
                        key={check.licenseId}
                        className={`z-check ${check.allowed ? "z-check-allow" : "z-check-deny"}`}
                      >
                        {check.allowed ? "ALLOWED" : "DENIED"} · {check.licenseId.slice(0, 8)}… ·{" "}
                        {check.reasonCode}
                      </span>
                    ))}
                    {failedParticipants.map((participant, index) => (
                      <span
                        key={`failed-${index}`}
                        className="z-check z-check-deny"
                      >
                        DATA FAILED · {String(participant.assetId ?? "participant").slice(0, 8)}… ·{" "}
                        {String(participant.reason ?? "UNAVAILABLE")}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
