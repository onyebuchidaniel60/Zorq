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
type Check = { roundId: string; licenseId: string; allowed: boolean; reasonCode: string; snapshotBlockNumber: number };

export function RunLive({ runId, initialRun, initialRounds, initialChecks }: { runId: string; initialRun: Run; initialRounds: Round[]; initialChecks: Check[] }) {
  const [run, setRun] = useState(initialRun);
  const [rounds, setRounds] = useState(initialRounds);
  const [checks, setChecks] = useState(initialChecks);

  useEffect(() => {
    if (["completed", "failed"].includes(run.status)) return;
    const timer = setInterval(() => {
      fetch(`/api/runs/${runId}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((data: { run: Run; rounds: Round[]; checks: Check[] }) => {
          setRun(data.run); setRounds(data.rounds); setChecks(data.checks);
        })
        .catch(() => undefined);
    }, 3000);
    return () => clearInterval(timer);
  }, [runId, run.status]);

  const tone = run.status === "completed" ? "success" : run.status === "failed" ? "danger" : "warning";

  return (
    <div className="space-y-5">
      <section className="rounded-[1.75rem] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#8a8a8f]">Run status</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{run.status}</p>
          </div>
          <StatusBadge tone={tone}>{run.status === "completed" ? "3 rounds complete" : run.status}</StatusBadge>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#f7f7f8] p-4"><p className="text-xs text-[#8a8a8f]">Round</p><p className="mt-1 text-xl font-semibold">{run.currentRound} / {run.totalRounds}</p></div>
          <div className="rounded-2xl bg-[#f7f7f8] p-4"><p className="text-xs text-[#8a8a8f]">Final model hash</p><p className="mt-1 break-all font-mono text-[10px]">{run.finalModelHash ?? "Not available"}</p></div>
          <div className="rounded-2xl bg-[#f7f7f8] p-4"><p className="text-xs text-[#8a8a8f]">Aggregate accuracy</p><p className="mt-1 text-xl font-semibold">{run.aggregateMetrics?.accuracy ? `${(Number(run.aggregateMetrics.accuracy) * 100).toFixed(1)}%` : "—"}</p></div>
        </div>
        {run.failureCode ? <p className="mt-4 rounded-2xl bg-[#f8ecec] px-4 py-3 text-sm text-[#7a2626]">{run.failureCode}: {run.failureMessage}</p> : null}
      </section>

      <section className="rounded-[1.75rem] bg-white p-6 sm:p-8">
        <h2 className="text-base font-semibold">Round snapshots</h2>
        <ol className="mt-4 space-y-3">
          {rounds.length === 0 ? <li className="text-sm text-[#6f6f74]">No rounds recorded yet.</li> : rounds.map((round) => {
            const roundChecks = checks.filter((check) => check.roundId === round.id);
            return (
              <li key={round.id} className="rounded-3xl bg-[#f7f7f8] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Round {round.roundNumber}</p>
                  <StatusBadge tone={round.status === "completed" ? "success" : "warning"}>{round.status}</StatusBadge>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-[#6f6f74] sm:grid-cols-2">
                  <p>Snapshot block: <span className="font-mono">{round.snapshotBlockNumber ?? "—"}</span></p>
                  <p className="break-all font-mono text-[10px]">{round.snapshotBlockHash ?? "—"}</p>
                  <p>Authorized: {round.authorizedCount ?? 0} · Aggregated: {round.aggregatedCount ?? 0}</p>
                  <p>Loss {round.aggregateMetrics?.loss ? Number(round.aggregateMetrics.loss).toFixed(4) : "—"} · Accuracy {round.aggregateMetrics?.accuracy ? `${(Number(round.aggregateMetrics.accuracy) * 100).toFixed(1)}%` : "—"}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {roundChecks.map((check) => (
                    <span key={check.licenseId} className={check.allowed ? "mint-chip" : "rounded-full bg-[#f8ecec] px-3 py-1.5 text-[11px] font-semibold text-[#7a2626]"}>
                      {check.licenseId.slice(0, 8)}… · {check.reasonCode}
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
