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
        actions={
          <Link href="/app/jobs/new" className="z-button">
            Create job
          </Link>
        }
      />
      {!session ? (
        <SignedOutCard feature="Job management" />
      ) : jobs.length === 0 ? (
        <section className="z-card z-side-card">
          <div className="z-empty">
            <h2 className="z-title-md">No published jobs</h2>
            <p className="z-copy max-w-xl">
              Publish a three-round binary-classification job with a fixed
              model preset and a bounded training window.
            </p>
            <Link href="/app/jobs/new" className="z-button mt-2">
              Create the first job
            </Link>
          </div>
        </section>
      ) : (
        <section className="z-card">
          <div className="z-card-header">
            <div>
              <p className="z-eyebrow">Job registry</p>
              <h2 className="z-title-md">Published jobs</h2>
            </div>
            <span className="z-chip z-chip-muted">{jobs.length} jobs</span>
          </div>
          <div className="z-table-wrap">
            <table className="z-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Status</th>
                  <th>Window</th>
                  <th>Cohort</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="z-table-row-link">
                    <td>
                      <Link
                        href={`/app/jobs/${job.id}`}
                        className="block text-[#f3f5ed] font-semibold"
                      >
                        {job.title}
                      </Link>
                      <span className="mt-0.5 block max-w-[24rem] truncate text-[11px] text-[#727969]">
                        {job.purposeText}
                      </span>
                    </td>
                    <td>
                      <StatusBadge tone={tone(job.status)}>{job.status}</StatusBadge>
                    </td>
                    <td className="text-[11px]">
                      {new Date(job.startsAt).toLocaleDateString()} →{" "}
                      {new Date(job.endsAt).toLocaleDateString()}
                    </td>
                    <td>
                      {job.maxParticipants} assets · {job.maxRounds} rounds
                    </td>
                    <td>
                      <Link className="z-link text-xs" href={`/app/jobs/${job.id}`}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
