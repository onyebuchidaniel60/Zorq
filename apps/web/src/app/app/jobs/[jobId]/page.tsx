import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Job detail",
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return (
    <>
      <PageHeader
        eyebrow="Training job"
        title="Job detail"
        description="Public purpose and model commitments, creator controls, license participation and run eligibility."
        actions={<StatusBadge tone="warning">Planned · Phase 3–4</StatusBadge>}
      />
      <PlaceholderPanel title="Job record is not available" phase="Phase 3–4">
        <p>
          Requested job identifier:
        </p>
        <p className="mt-2 rounded-md bg-slate-100 px-3 py-2 font-mono text-xs break-all text-slate-700">
          {jobId}
        </p>
        <p className="mt-3">
          This screen will show the job window, purpose hash, fixed model
          configuration, authorized cohort count and creator-only pause/resume/close
          controls. Starting a run will require at least two distinct authorized
          assets and will be disabled with an explanation when the job is paused,
          closed, out of window or already running.
        </p>
      </PlaceholderPanel>
    </>
  );
}
