import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { SignedOutCard } from "@/components/wallet/signed-out-card";
import { JobActions } from "@/components/jobs/job-actions";
import { getSessionFromCookies } from "@/server/auth/session";
import { getJob } from "@/server/domain/jobs";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Job detail" };

export default async function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const session = await getSessionFromCookies();
  const { jobId } = await params;
  if (!session) return <SignedOutCard feature="Job detail" />;
  let result;
  try { result = await getJob(jobId, session.walletAddress); } catch { notFound(); }
  const { job } = result!;
  const tone = job.status === "open" ? "success" : job.status === "paused" ? "warning" : "neutral";

  return (
    <>
      <PageHeader
        eyebrow="Federated-learning job"
        title={job.title}
        description={job.description ?? "Public job definition."}
        actions={<StatusBadge tone={tone}>{job.status}</StatusBadge>}
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <section className="rounded-[1.75rem] bg-white p-6">
            <h2 className="text-base font-semibold">Public purpose</h2>
            <p className="mt-2 text-sm leading-6 text-[#6f6f74]">{job.purposeText}</p>
            <dl className="mt-5 grid gap-3 text-xs sm:grid-cols-2">
              <div><dt className="text-[#8a8a8f]">Model preset</dt><dd className="mt-1 font-mono">{job.modelKey}</dd></div>
              <div><dt className="text-[#8a8a8f]">Rounds</dt><dd className="mt-1">{job.maxRounds}</dd></div>
              <div><dt className="text-[#8a8a8f]">Window</dt><dd className="mt-1">{new Date(job.startsAt).toLocaleString()} → {new Date(job.endsAt).toLocaleString()}</dd></div>
              <div><dt className="text-[#8a8a8f]">Cohort cap</dt><dd className="mt-1">{job.maxParticipants} distinct assets</dd></div>
            </dl>
            <p className="mt-4 break-all font-mono text-[10px] text-[#9a9aa0]">purpose {job.purposeHash}</p>
            <p className="mt-1 break-all font-mono text-[10px] text-[#9a9aa0]">model {job.modelConfigHash}</p>
          </section>

          <section className="rounded-[1.75rem] bg-white p-6">
            <h2 className="text-base font-semibold">Authorized participants</h2>
            {result!.participants.length === 0 ? <p className="mt-2 text-sm text-[#6f6f74]">No licenses confirmed yet.</p> : (
              <ul className="mt-3 space-y-2">
                {result!.participants.map((participant) => (
                  <li key={participant.licenseId} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#f7f7f8] px-4 py-3 text-xs">
                    <span className="font-mono">{participant.ownerWallet.slice(0, 10)}…</span>
                    <span className="text-[#8a8a8f]">asset {participant.assetId.slice(0, 8)}…</span>
                    <span className="mint-chip">license confirmed</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-[#8a8a8f]">Private asset names and descriptions are never shown to the job creator.</p>
          </section>
        </div>

        <JobActions job={{
          id: job.id,
          chainJobId: job.chainJobId,
          status: job.status,
          startsAt: job.startsAt.toISOString(),
          endsAt: job.endsAt.toISOString(),
          maxParticipants: job.maxParticipants,
          creatorWallet: job.creatorWallet,
        }} />
      </div>
    </>
  );
}
