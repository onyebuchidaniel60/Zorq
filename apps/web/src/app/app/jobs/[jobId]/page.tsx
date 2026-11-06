import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { BackLink } from "@/components/back-link";
import { StatusBadge } from "@/components/status-badge";
import { SignedOutCard } from "@/components/wallet/signed-out-card";
import { JobActions } from "@/components/jobs/job-actions";
import { getSessionFromCookies } from "@/server/auth/session";
import { getJob } from "@/server/domain/jobs";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Job detail" };

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const session = await getSessionFromCookies();
  const { jobId } = await params;
  if (!session) {
    return (
      <>
        <BackLink href="/app/jobs" label="Back to jobs" />
        <PageHeader
          eyebrow="Federated-learning job"
          title="Job detail"
          description="Connect your wallet to view this job."
        />
        <SignedOutCard feature="Job detail" />
      </>
    );
  }

  let result;
  try {
    result = await getJob(jobId, session.walletAddress);
  } catch {
    notFound();
  }
  const { job } = result!;
  const tone =
    job.status === "open"
      ? "success"
      : job.status === "paused" || job.status === "pending_chain"
        ? "warning"
        : "neutral";

  return (
    <>
      <BackLink href="/app/jobs" label="Back to jobs" />
      <PageHeader
        eyebrow="Federated-learning job"
        title={job.title}
        description={job.description ?? "Public job definition."}
        actions={<StatusBadge tone={tone}>{job.status === "pending_chain" ? "pending" : job.status}</StatusBadge>}
      />
      <div className="z-detail-grid">
        <div>
          <section className="z-card z-detail-card">
            <div className="z-card-header z-card-header-tight">
              <div>
                <p className="z-eyebrow">Public purpose</p>
                <h2 className="z-title-md">What this job trains</h2>
              </div>
              <span className="z-chip z-chip-muted">Binary classifier v1</span>
            </div>
            <p className="z-copy">{job.purposeText}</p>
            <dl className="z-kv mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt>Window</dt>
                <dd>
                  {new Date(job.startsAt).toLocaleString()} →{" "}
                  {new Date(job.endsAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt>Rounds</dt>
                <dd>{job.maxRounds} fixed rounds</dd>
              </div>
              <div>
                <dt>Cohort cap</dt>
                <dd>{job.maxParticipants} distinct assets</dd>
              </div>
              <div>
                <dt>Creator</dt>
                <dd>
                  <code>{job.creatorWallet}</code>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt>Purpose commitment</dt>
                <dd>
                  <code>{job.purposeHash}</code>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt>Model configuration commitment</dt>
                <dd>
                  <code>{job.modelConfigHash}</code>
                </dd>
              </div>
            </dl>
          </section>

          <section className="z-card z-detail-card">
            <div className="z-card-header z-card-header-tight">
              <div>
                <p className="z-eyebrow">Authorization</p>
                <h2 className="z-title-md">Authorized participants</h2>
              </div>
              <span className="z-chip z-chip-muted">
                {result!.participants.length} confirmed
              </span>
            </div>
            {result!.participants.length === 0 ? (
              <p className="z-copy">No licenses confirmed yet.</p>
            ) : (
              <div className="z-list">
                {result!.participants.map((participant) => (
                  <div key={participant.licenseId} className="z-participant">
                    <code>{participant.ownerWallet.slice(0, 12)}…</code>
                    <span className="text-[#727969]">asset {participant.assetId.slice(0, 8)}…</span>
                    <span className="z-chip z-chip-success">license confirmed</span>
                  </div>
                ))}
              </div>
            )}
            <p className="z-help mt-3">
              Private asset names and descriptions are never shown to the job
              creator.
            </p>
          </section>
        </div>

        <JobActions
          job={{
            id: job.id,
            chainJobId: job.chainJobId,
            status: job.status,
            startsAt: job.startsAt.toISOString(),
            endsAt: job.endsAt.toISOString(),
            maxParticipants: job.maxParticipants,
            creatorWallet: job.creatorWallet,
          }}
        />
      </div>
    </>
  );
}
