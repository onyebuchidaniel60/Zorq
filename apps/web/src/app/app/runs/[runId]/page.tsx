import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Run monitor",
};

const rounds = [1, 2, 3];

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;

  return (
    <>
      <PageHeader
        eyebrow="Federated run"
        title="Run monitor"
        description="Round timeline, one confirmed authorization snapshot per round, allow/deny decisions, aggregate metrics and the final model hash."
        actions={<StatusBadge tone="warning">Planned · Phase 4</StatusBadge>}
      />
      <PlaceholderPanel title="Run record is not available" phase="Phase 4">
        <p>Requested run identifier:</p>
        <p className="mt-2 rounded-md bg-slate-100 px-3 py-2 font-mono text-xs break-all text-slate-700">
          {runId}
        </p>
        <p className="mt-3">
          No training has started. The timeline below is a structural preview, not
          a recorded execution.
        </p>
      </PlaceholderPanel>

      <section aria-labelledby="round-preview" className="rounded-xl border border-border bg-surface p-6">
        <h2 id="round-preview" className="text-base font-semibold">
          Round timeline preview
        </h2>
        <ol className="mt-4 space-y-3">
          {rounds.map((round) => (
            <li
              key={round}
              className="flex flex-col gap-2 rounded-lg border border-dashed border-slate-300 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold">Round {round}</p>
                <p className="text-xs text-muted">
                  Awaiting implementation: snapshot block number/hash, authorized
                  and aggregated counts.
                </p>
              </div>
              <StatusBadge tone="neutral">Not run</StatusBadge>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs leading-5 text-muted">
          Per-client updates, partitions, raw data and individual metrics are
          never displayed. Only aggregate evaluation metrics are recorded.
        </p>
      </section>
    </>
  );
}
