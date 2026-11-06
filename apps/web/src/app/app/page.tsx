import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb, trainingRuns } from "@zorq/db";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { SignedOutCard } from "@/components/wallet/signed-out-card";
import { getSessionFromCookies } from "@/server/auth/session";
import { listAssets } from "@/server/domain/assets";
import { listJobs } from "@/server/domain/jobs";
import { listLicenses } from "@/server/domain/licenses";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "App overview" };

export default async function AppOverviewPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    return (
      <>
        <PageHeader eyebrow="Overview" title="Your authorization workspace" description="Sign in with a Substrate wallet to manage DataLicenses and runs." />
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
  const runs = await db.select().from(trainingRuns).where(eq(trainingRuns.requestedByWallet, session.walletAddress)).orderBy(desc(trainingRuns.createdAt)).limit(3);
  const activeLicenses = licenses.filter((license) => license.statusMirror === "active").length;

  const stats = [
    { label: "Active assets", value: assets.filter((asset) => asset.status === "active").length, href: "/app/assets" },
    { label: "Open jobs", value: jobs.filter((job) => job.status === "open").length, href: "/app/jobs" },
    { label: "Active licenses", value: activeLicenses, href: "/app/licenses" },
    { label: "Completed runs", value: runs.filter((run) => run.status === "completed").length, href: "/app/jobs" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Authorization workspace"
        description="Assets, jobs, licenses and run evidence for the connected wallet."
        actions={<Link href="/app/jobs/new" className="pill-button">New job</Link>}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="rounded-[1.75rem] bg-white p-5 transition-transform hover:-translate-y-0.5">
            <p className="text-xs text-[#8a8a8f]">{stat.label}</p>
            <p className="mt-2 text-4xl font-semibold tracking-[-0.04em]">{stat.value}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-[1.75rem] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Recent runs</h2>
            <p className="mt-1 text-sm text-[#6f6f74]">Only runs requested by this wallet are listed.</p>
          </div>
          <StatusBadge tone="success">Fail-closed snapshots</StatusBadge>
        </div>
        {runs.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-[#f7f7f8] p-4 text-sm text-[#6f6f74]">
            No runs yet. Open a job with at least two active licenses to start the three-round demonstration.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {runs.map((run) => (
              <li key={run.id}>
                <Link href={`/app/runs/${run.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#f7f7f8] px-4 py-3 text-sm">
                  <span className="font-mono text-xs">{run.id.slice(0, 8)}…</span>
                  <span className="text-[#6f6f74]">round {run.currentRound}/{run.totalRounds}</span>
                  <StatusBadge tone={run.status === "completed" ? "success" : run.status === "failed" ? "danger" : "warning"}>{run.status}</StatusBadge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
