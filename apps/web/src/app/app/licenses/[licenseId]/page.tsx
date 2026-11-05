import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "License detail",
};

export default async function LicenseDetailPage({
  params,
}: {
  params: Promise<{ licenseId: string }>;
}) {
  const { licenseId } = await params;

  return (
    <>
      <PageHeader
        eyebrow="Data license"
        title="License detail"
        description="Conditions, binding, chain evidence and snapshot history for one DataLicense."
        actions={<StatusBadge tone="warning">Planned · Phase 3</StatusBadge>}
      />
      <PlaceholderPanel title="License record is not available" phase="Phase 3–4">
        <p>Requested license identifier:</p>
        <p className="mt-2 rounded-md bg-slate-100 px-3 py-2 font-mono text-xs break-all text-slate-700">
          {licenseId}
        </p>
        <p className="mt-3">
          The owner will see token ID, asset reference, job, validity interval,
          revision and revocation action. The job creator receives a sanitized
          view without private asset metadata. Revocation is terminal for that
          token; a contribution already admitted to the current round may finish.
        </p>
      </PlaceholderPanel>
    </>
  );
}
