import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Data licenses",
};

export default function LicensesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Data provider"
        title="Data licenses"
        description="Non-transferable rights issued by your wallet for one asset and one job. Validity uses an exclusive end timestamp."
        actions={<StatusBadge tone="warning">Not connected</StatusBadge>}
      />
      <div className="flex flex-wrap gap-2">
        <StatusBadge tone="neutral">0 licenses</StatusBadge>
        <StatusBadge tone="info">ERC-721 · soulbound</StatusBadge>
      </div>
      <PlaceholderPanel title="No licenses to display" phase="Phase 3">
        <p>
          Licenses will appear here with asset reference, job, validity window,
          token ID, revision and revocation availability. Transfer controls are
          never shown because the token is non-transferable.
        </p>
        <Link
          className="mt-4 inline-block font-semibold text-accent-strong underline underline-offset-2"
          href="/app/jobs"
        >
          Browse jobs to license an asset
        </Link>
      </PlaceholderPanel>
    </>
  );
}
