import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Data assets",
};

export default function AssetsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Data provider"
        title="Data assets"
        description="Register opaque asset commitments and manage the synthetic partitions assigned to your wallet. Raw datasets are never uploaded."
        actions={
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-md border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500"
          >
            Register asset · Phase 3
          </button>
        }
      />
      <div className="flex flex-wrap gap-2">
        <StatusBadge tone="neutral">0 assets</StatusBadge>
        <StatusBadge tone="warning">Not connected</StatusBadge>
      </div>
      <PlaceholderPanel title="No assets to display" phase="Phase 3">
        <p>
          Once wallet authentication and the asset draft API are implemented,
          this page will list only the connected wallet&apos;s assets with status,
          synthetic partition label and confirmation evidence.
        </p>
        <Link
          className="mt-4 inline-block font-semibold text-accent-strong underline underline-offset-2"
          href="/app/assets/new"
        >
          Preview the registration screen
        </Link>
      </PlaceholderPanel>
    </>
  );
}
