import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Register a data asset",
};

export default function NewAssetPage() {
  return (
    <>
      <PageHeader
        eyebrow="Data provider"
        title="Register a data asset"
        description="Create an opaque on-chain asset reference plus a server-side salted metadata commitment. No file upload exists in this product."
        actions={<StatusBadge tone="warning">Form preview · Phase 3</StatusBadge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <form className="rounded-xl border border-border bg-surface p-6" aria-describedby="asset-form-note">
          <fieldset disabled className="space-y-5 opacity-70">
            <legend className="text-base font-semibold">Asset details</legend>
            <div>
              <label htmlFor="asset-name" className="block text-sm font-medium">
                Display name
              </label>
              <input
                id="asset-name"
                name="displayName"
                type="text"
                placeholder="e.g. Synthetic cohort A"
                className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-muted">3–80 characters. Owner-only metadata.</p>
            </div>
            <div>
              <label htmlFor="asset-description" className="block text-sm font-medium">
                Description <span className="font-normal text-muted">(optional)</span>
              </label>
              <textarea
                id="asset-description"
                name="description"
                rows={4}
                maxLength={500}
                placeholder="Synthetic demonstration partition only. Do not enter real personal or customer data."
                className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="asset-partition" className="block text-sm font-medium">
                Synthetic demo partition
              </label>
              <select
                id="asset-partition"
                name="demoPartitionId"
                className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
              >
                <option>Partition 0</option>
                <option>Partition 1</option>
                <option>Partition 2</option>
                <option>Partition 3</option>
                <option>Partition 4</option>
              </select>
              <p className="mt-1 text-xs text-muted">
                One active asset per synthetic partition. A partition is not real data.
              </p>
            </div>
          </fieldset>
          <p id="asset-form-note" className="mt-5 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            This form is disabled until the Phase 3 asset draft and on-chain
            confirmation flow exists. It cannot submit, sign or register anything
            today.
          </p>
        </form>

        <PlaceholderPanel title="Transaction review" phase="Phase 3">
          After submitting, the wallet will sign{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">
            registerAsset(chainAssetId, metadataCommitment)
          </code>
          . The backend will verify chain ID, contract, sender, receipt and event
          arguments before activating the asset. A client-supplied hash is never
          trusted by itself.
        </PlaceholderPanel>
      </div>
    </>
  );
}
