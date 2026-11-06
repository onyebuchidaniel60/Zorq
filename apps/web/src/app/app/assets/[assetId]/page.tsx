import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { BackLink } from "@/components/back-link";
import { StatusBadge } from "@/components/status-badge";
import { SignedOutCard } from "@/components/wallet/signed-out-card";
import { Icon } from "@/components/ui-icon";
import { ExplorerTxLink } from "@/components/explorer-tx-link";
import { getSessionFromCookies } from "@/server/auth/session";
import { getAssetForOwner } from "@/server/domain/assets";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Asset detail" };

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const session = await getSessionFromCookies();
  const { assetId } = await params;
  if (!session) {
    return (
      <>
        <BackLink href="/app/assets" label="Back to assets" />
        <PageHeader
          eyebrow="Data asset"
          title="Asset detail"
          description="Connect your wallet to view owner-only asset metadata."
        />
        <SignedOutCard feature="Asset detail" />
      </>
    );
  }

  let asset;
  try {
    asset = await getAssetForOwner(assetId, session.walletAddress);
  } catch {
    notFound();
  }

  return (
    <>
      <BackLink href="/app/assets" label="Back to assets" />
      <PageHeader
        eyebrow="Data asset"
        title={asset!.displayName}
        description={asset!.description ?? "Owner-only asset metadata."}
        actions={
          <StatusBadge
            tone={
              asset!.status === "active"
                ? "success"
                : asset!.status === "pending_chain"
                  ? "warning"
                  : "neutral"
            }
          >
            {asset!.status === "pending_chain" ? "pending" : asset!.status}
          </StatusBadge>
        }
      />
      <div className="z-detail-grid">
        <section className="z-card z-detail-card">
          <div className="z-card-header z-card-header-tight">
            <div>
              <p className="z-eyebrow">Commitment record</p>
              <h2 className="z-title-md">Asset metadata</h2>
            </div>
            <span className="z-chip z-chip-muted">On-chain</span>
          </div>
          <dl className="z-kv">
            <div>
              <dt>Data source</dt>
              <dd>{asset!.dataSource === "external" ? "External database" : `Partition ${asset!.demoPartitionId}`}</dd>
            </div>
            {asset!.dataSource === "external" ? (
              <>
                <div>
                  <dt>External table</dt>
                  <dd>{asset!.dbTable ?? "Not configured"}</dd>
                </div>
                <div>
                  <dt>Target label column</dt>
                  <dd>{asset!.labelColumn ?? "label"}</dd>
                </div>
              </>
            ) : null}
            <div>
              <dt>Registered</dt>
              <dd>{new Date(asset!.createdAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt>On-chain asset ID</dt>
              <dd>
                <code>{asset!.chainAssetId}</code>
              </dd>
            </div>
            <div>
              <dt>Metadata commitment</dt>
              <dd>
                <code>{asset!.metadataCommitment}</code>
              </dd>
            </div>
            {asset!.chainTxHash ? (
              <div>
                <dt>Registration transaction</dt>
                <dd>
                  <code>{asset!.chainTxHash}</code>
                  <span className="mt-1 block text-[10px] text-[#727969]">
                    {asset!.chainBlockNumber
                      ? `Block ${asset!.chainBlockNumber}`
                      : "Awaiting confirmation"}
                  </span>
                  <div className="mt-2">
                    <ExplorerTxLink
                      txHash={asset!.chainTxHash}
                      confirmed={asset!.status === "active" || asset!.status === "deactivated"}
                      label="View on explorer"
                      description="Open asset registration transaction in the Portaldot explorer"
                    />
                  </div>
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <aside className="z-stack">
          <section className="z-card z-card-lime z-side-card">
            <div className="z-icon-tile">
              <Icon name="shield" className="size-4" />
            </div>
            <h2 className="z-title-md z-text-dark">Commitment, not encryption</h2>
            <p className="z-copy z-text-dark-soft">
              A commitment is integrity evidence. Raw data partitions never
              leaves the worker runtime and is never stored by Zorq.
            </p>
          </section>
          <section className="z-card z-side-card">
            <p className="z-eyebrow">Owner</p>
            <p className="mt-2 break-all font-mono text-[11px] text-[#c9cec0]">
              {session.walletAddress}
            </p>
            <p className="z-help mt-2">
              Asset names and descriptions are visible only to the owning wallet.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
