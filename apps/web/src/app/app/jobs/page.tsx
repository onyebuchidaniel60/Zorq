import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { SignedOutCard } from "@/components/wallet/signed-out-card";
import { getSessionFromCookies } from "@/server/auth/session";
import { listJobs } from "@/server/domain/jobs";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Training jobs" };

function tone(status: string) {
  if (status === "open") return "success" as const;
  if (status === "paused") return "warning" as const;
  return "neutral" as const;
}

export default async function JobsPage() {
  const session = await getSessionFromCookies();
  const jobs = session ? await listJobs() : [];

  return (
    <>
      <PageHeader
        eyebrow="Researcher"
        title="Training jobs"
        description="Public job definitions with fixed purpose and model-configuration commitments."
        actions={<Link href="/app/jobs/new" className="pill-button">Create job</Link>}
      />
      {!session ? (
        <SignedOutCard feature="Job management" />
      ) : jobs.length === 0 ? (
        <section className="rounded-[1.75rem] bg-white p-8">
          <h2 className="text-xl font-semibold tracking-tight">No published jobs</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#6f6f74]">
            Publish a three-round synthetic binary-classification job with a fixed
            model preset and a bounded training window.
          </p>
          <Link href="/app/jobs/new" className="pill-button mt-5">Create the first job</Link>
        </section>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/app/jobs/${job.id}`} className="rounded-[1.75rem] bg-white p-5 transition-transform hover:-translate-y-0.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold tracking-tight">{job.title}</p>
                  <p className="mt-1 text-xs text-[#8a8a8f]">{job.purposeText.slice(0, 120)}…</p>
                </div>
                <StatusBadge tone={tone(job.status)}>{job.status}</StatusBadge>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#6f6f74]">
                <span>Max cohort: {job.maxParticipants} assets</span>
                <span>Rounds: {job.maxRounds}</span>
                <span>{new Date(job.startsAt).toLocaleDateString()} → {new Date(job.endsAt).toLocaleDateString()}</span>
                <span className="font-mono text-[10px] text-[#9a9aa0]">{job.modelKey}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
