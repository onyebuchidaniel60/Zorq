import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Training jobs",
};

export default function JobsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Researcher"
        title="Training jobs"
        description="Public federated-learning job definitions. Job purpose and model configuration are fixed when the job is published."
        actions={
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-md border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500"
          >
            Create job · Phase 3
          </button>
        }
      />
      <div className="flex flex-wrap gap-2">
        <StatusBadge tone="neutral">0 jobs</StatusBadge>
        <StatusBadge tone="warning">Not connected</StatusBadge>
      </div>
      <PlaceholderPanel title="No jobs to display" phase="Phase 3">
        <p>
          Published jobs will appear here with purpose, creator wallet, training
          window, participant count and open/paused/closed state. Private asset
          metadata is never included.
        </p>
        <Link
          className="mt-4 inline-block font-semibold text-accent-strong underline underline-offset-2"
          href="/app/jobs/new"
        >
          Preview the job creation screen
        </Link>
      </PlaceholderPanel>
    </>
  );
}
