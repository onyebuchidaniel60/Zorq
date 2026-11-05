import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Asset detail",
};

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;

  return (
    <>
      <PageHeader
        eyebrow="Data asset"
        title="Asset detail"
        description="Owner-only metadata, on-chain reference, metadata commitment, status and related licenses."
        actions={<StatusBadge tone="warning">Planned · Phase 3</StatusBadge>}
      />
      <PlaceholderPanel title="Asset record is not available" phase="Phase 3">
        <p>
          The requested asset identifier is shown below. No database lookup or
          chain read exists yet, so the application does not fabricate an owner,
          status or commitment.
        </p>
        <p className="mt-3 rounded-md bg-slate-100 px-3 py-2 font-mono text-xs break-all text-slate-700">
          {assetId}
        </p>
        <p className="mt-3">
          Once implemented, another wallet receives a 404 without private
          metadata leakage, and only the owning wallet sees the display name and
          description.
        </p>
      </PlaceholderPanel>
    </>
  );
}
