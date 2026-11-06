import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb, trainingRuns } from "@zorq/db";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { SignedOutCard } from "@/components/wallet/signed-out-card";
import { Icon } from "@/components/ui-icon";
import { getSessionFromCookies } from "@/server/auth/session";
import { listAssets } from "@/server/domain/assets";
import { listJobs } from "@/server/domain/jobs";
import { listLicenses } from "@/server/domain/licenses";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "App overview" };

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function shortHash(value: string | undefined): string {
  if (!value) {
    return "Configured";
  }
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function runTone(status: string) {
  return status === "completed"
    ? ("success" as const)
    : status === "failed"
      ? ("danger" as const)
      : ("warning" as const);
}

export default async function AppOverviewPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    return (
      <>
        <PageHeader
          eyebrow="Overview"
          title="Your authorization workspace"
          description="Sign in with a Substrate wallet to manage DataLicenses and runs."
        />
        <SignedOutCard feature="The Zorq workspace" />
      </>
    );
  }

  const [assets, jobs, licenses] = await Promise.all([
    listAssets(session.walletAddress),
    listJobs(),
    listLicenses(session.walletAddress),
  ]);
  const db = getDb();
  const runs = await db
    .select()
    .from(trainingRuns)
    .where(eq(trainingRuns.requestedByWallet, session.walletAddress))
    .orderBy(desc(trainingRuns.createdAt))
    .limit(4);
  const activeAssets = assets.filter((asset) => asset.status === "active").length;
  const activeLicenses = licenses.filter((license) => license.statusMirror === "active").length;
  const openJobs = jobs.filter((job) => job.status === "open").length;
  const completedRuns = runs.filter((run) => run.status === "completed").length;
  const jobTitles = new Map(jobs.map((job) => [job.id, job.title]));
  const latestRun = runs[0];
  const contract = process.env.NEXT_PUBLIC_ZORQ_CONTRACT_ADDRESS;

  const stats = [
    {
      label: "Active assets",
      value: activeAssets,
      meta: `${assets.length} registered in this wallet`,
      href: "/app/assets",
      lime: true,
      icon: "database" as const,
    },
    {
      label: "Open jobs",
      value: openJobs,
      meta: `${jobs.length} public job definitions`,
      href: "/app/jobs",
      lime: true,
      icon: "briefcase" as const,
    },
    {
      label: "Active licenses",
      value: activeLicenses,
      meta: `${licenses.length} total issued rights`,
      href: "/app/licenses",
      lime: true,
      icon: "license" as const,
    },
    {
      label: "Completed runs",
      value: completedRuns,
      meta: `${runs.length} recent runs requested`,
      href: latestRun ? `/app/runs/${latestRun.id}` : "/app/jobs",
      lime: false,
      icon: "activity" as const,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Authorization overview"
        title={`Hello, ${shortAddress(session.walletAddress)}`}
        description="The live contract state for your assets, jobs and licenses. Every training round reads a fresh authorization snapshot."
        actions={
          <>
            <Link href="/app/jobs/new" className="z-button">
              <Icon name="plus" className="size-3.5" />
              New job
            </Link>
            <Link href="/app/assets/new" className="z-button-secondary">
              Register asset
            </Link>
          </>
        }
      />

      <div className="z-stat-grid">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`z-stat ${stat.lime ? "z-stat-lime" : ""}`}
          >
            <span className="z-stat-label">
              {stat.label}
              <Icon name={stat.icon} className="size-4 opacity-70" />
            </span>
            <span className="z-stat-value">{stat.value}</span>
            <span className="z-stat-meta">{stat.meta}</span>
          </Link>
        ))}
      </div>

      <div className="z-dashboard-grid">
        <div className="z-stack">
          <section className="z-card z-side-card">
            <div className="z-card-header z-card-header-tight">
              <div>
                <p className="z-eyebrow">Live execution</p>
                <h2 className="z-title-md">Round activity</h2>
              </div>
              <StatusBadge tone="info">Fail-closed</StatusBadge>
            </div>

            {latestRun ? (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] text-[#727969]">
                      {jobTitles.get(latestRun.jobId) ?? "Federated run"}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#f3f5ed]">
                      {latestRun.currentRound}
                      <span className="text-sm font-normal text-[#727969]">
                        {" "}
                        / {latestRun.totalRounds} rounds
                      </span>
                    </p>
                  </div>
                  <Link href={`/app/runs/${latestRun.id}`} className="z-button-secondary">
                    Open monitor
                  </Link>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((round) => {
                    const reached = round <= latestRun.currentRound;
                    const metric = latestRun.aggregateMetrics?.accuracy;
                    return (
                      <div key={round} className="rounded-[12px] bg-white/[0.025] p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-[0.14em] text-[#727969]">
                            Round {round}
                          </span>
                          <span
                            className={`size-1.5 rounded-full ${
                              reached ? "bg-[#d9ff63]" : "bg-white/15"
                            }`}
                            aria-hidden="true"
                          />
                        </div>
                        <p className="mt-5 font-mono text-[11px] text-[#c9cec0]">
                          {reached ? "snapshot" : "pending"}
                        </p>
                        {round === latestRun.currentRound && metric ? (
                          <p className="mt-1 text-[10px] text-[#727969]">
                            {(Number(metric) * 100).toFixed(1)}% accuracy
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="z-empty">
                <p className="z-title-md">No run evidence yet</p>
                <p className="z-copy">
                  Open a job with at least two active licenses to start the
                  three-round demonstration.
                </p>
                <Link href="/app/jobs" className="z-button mt-2">
                  Browse jobs
                </Link>
              </div>
            )}
          </section>

          <section className="z-card">
            <div className="z-card-header">
              <div>
                <p className="z-eyebrow">Execution history</p>
                <h2 className="z-title-md">Recent runs</h2>
              </div>
              <span className="z-chip z-chip-muted">{runs.length} most recent</span>
            </div>
            {runs.length === 0 ? (
              <p className="p-5 text-sm text-[#9aa08f]">
                No runs have been requested by this wallet.
              </p>
            ) : (
              <div className="z-table-wrap">
                <table className="z-table">
                  <thead>
                    <tr>
                      <th>Run</th>
                      <th>Job</th>
                      <th>Round</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((run) => (
                      <tr key={run.id} className="z-table-row-link">
                        <td>
                          <Link href={`/app/runs/${run.id}`} className="font-mono text-xs text-[#f3f5ed]">
                            {run.id.slice(0, 8)}…
                          </Link>
                        </td>
                        <td className="max-w-[15rem] truncate">
                          {jobTitles.get(run.jobId) ?? "Federated run"}
                        </td>
                        <td>
                          {run.currentRound}/{run.totalRounds}
                        </td>
                        <td>
                          <StatusBadge tone={runTone(run.status)}>{run.status}</StatusBadge>
                        </td>
                        <td>
                          <Link className="z-link text-xs" href={`/app/runs/${run.id}`}>
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="z-stack">
          <section className="z-card z-card-lime z-side-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="z-eyebrow z-eyebrow-dark">Network</p>
                <h2 className="z-title-md z-text-dark">Portaldot V3 testnet</h2>
              </div>
              <span className="grid size-9 place-items-center rounded-[10px] bg-[#11140a] text-[#d9ff63]">
                <Icon name="activity" className="size-4" />
              </span>
            </div>
            <div className="mt-4 grid gap-2">
              <div className="z-side-row">
                <span className="z-muted">Chain ID</span>
                <span className="z-side-value">420420777</span>
              </div>
              <div className="z-side-row">
                <span className="z-muted">Contract</span>
                <span className="z-side-value">{shortHash(contract)}</span>
              </div>
              <div className="z-side-row">
                <span className="z-muted">Coordinator</span>
                <span className="z-side-value">Flower demo</span>
              </div>
              <div className="z-side-row">
                <span className="z-muted">Snapshot</span>
                <span className="z-side-value">One block / round</span>
              </div>
            </div>
          </section>

          <section className="z-card z-side-card">
            <div className="z-card-header z-card-header-tight">
              <div>
                <p className="z-eyebrow">Workspace</p>
                <h2 className="z-title-md">Recent assets</h2>
              </div>
              <Link href="/app/assets" className="z-link text-xs">
                View all
              </Link>
            </div>
            {assets.length === 0 ? (
              <p className="z-copy">No assets registered yet.</p>
            ) : (
              <div className="z-list">
                {assets.slice(0, 3).map((asset) => (
                  <Link key={asset.id} href={`/app/assets/${asset.id}`} className="z-list-row">
                    <span className="z-list-main">
                      <span className="z-list-title">{asset.displayName}</span>
                      <span className="z-list-meta">Partition {asset.demoPartitionId}</span>
                    </span>
                    <span className="z-chip z-chip-muted">{asset.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="z-card z-side-card">
            <div className="z-card-header z-card-header-tight">
              <div>
                <p className="z-eyebrow">Data boundary</p>
                <h2 className="z-title-md">Synthetic only</h2>
              </div>
              <Icon name="shield" className="size-4 text-[#d9ff63]" />
            </div>
            <p className="z-copy">
              No raw dataset is uploaded. Asset commitments are integrity evidence,
              not encryption. Federated learning is not automatically privacy
              preserving against update leakage or poisoning.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
