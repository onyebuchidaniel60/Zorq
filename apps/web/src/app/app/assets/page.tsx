import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { SignedOutCard } from "@/components/wallet/signed-out-card";
import { PendingSync } from "@/components/pending-sync";
import { BackLink } from "@/components/back-link";
import { ExplorerTxLink } from "@/components/explorer-tx-link";
import { getSessionFromCookies } from "@/server/auth/session";
import { listAssets } from "@/server/domain/assets";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Data assets" };

function tone(status: string) {
  if (status === "active") return "success" as const;
  if (status === "deactivated") return "neutral" as const;
  if (status === "tx_failed") return "danger" as const;
  return "warning" as const;
}

export default async function AssetsPage() {
  const session = await getSessionFromCookies();
  const assets = session ? await listAssets(session.walletAddress) : [];
  const pending = assets
    .filter((asset) => asset.status === "pending_chain" && asset.chainTxHash && asset.chainBlockHash)
    .map((asset) => ({
      id: asset.id,
      txHash: asset.chainTxHash as string,
      blockHash: asset.chainBlockHash as string,
    }));

  return (
    <>
      <BackLink href="/app" label="Back to overview" />
      <PageHeader
        eyebrow="Data provider"
        title="Data assets"
        description="Opaque asset commitments owned by your wallet. Raw datasets never leave the provider environment."
        actions={
          <Link href="/app/assets/new" className="z-button">
            Register asset
          </Link>
        }
      />
      <PendingSync kind="assets" items={pending} />
      {!session ? (
        <SignedOutCard feature="Asset management" />
      ) : assets.length === 0 ? (
        <section className="z-card z-side-card">
          <div className="z-empty">
            <h2 className="z-title-md">No assets yet</h2>
            <p className="z-copy max-w-xl">
              Register a data partition to create an on-chain asset
              commitment. Each partition can be used by one active asset.
            </p>
            <Link href="/app/assets/new" className="z-button mt-2">
              Register your first asset
            </Link>
          </div>
        </section>
      ) : (
        <section className="z-card">
          <div className="z-card-header">
            <div>
              <p className="z-eyebrow">Portfolio</p>
              <h2 className="z-title-md">Registered assets</h2>
            </div>
            <span className="z-chip z-chip-muted">{assets.length} assets</span>
          </div>
          <div className="z-table-wrap">
            <table className="z-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Partition</th>
                  <th>Status</th>
                  <th>Chain reference</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id} className="z-table-row-link">
                    <td>
                      <Link
                        href={`/app/assets/${asset.id}`}
                        className="block text-[#f3f5ed] font-semibold"
                      >
                        {asset.displayName}
                      </Link>
                      <span className="mt-0.5 block max-w-[18rem] truncate text-[11px] text-[#727969]">
                        {asset.description ?? "No description"}
                      </span>
                    </td>
                    <td>{asset.dataSource === "external" ? "External database" : `Partition ${asset.demoPartitionId}`}</td>
                    <td>
                      <StatusBadge tone={tone(asset.status)}>
                        {asset.status === "pending_chain" ? "pending" : asset.status}
                      </StatusBadge>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5">
                        <code className="font-mono text-[10px] text-[#9aa08f]">
                          {asset.chainAssetId.slice(0, 10)}…{asset.chainAssetId.slice(-6)}
                        </code>
                        <ExplorerTxLink
                          txHash={asset.chainTxHash}
                          confirmed={asset.status !== "pending_chain" && asset.status !== "draft"}
                          label={`Open ${asset.displayName} registration transaction in the Portaldot explorer`}
                          compact
                        />
                      </span>
                    </td>
                    <td>
                      <Link className="z-link text-xs" href={`/app/assets/${asset.id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
