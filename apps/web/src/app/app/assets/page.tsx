import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { SignedOutCard } from "@/components/wallet/signed-out-card";
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

  return (
    <>
      <PageHeader
        eyebrow="Data provider"
        title="Data assets"
        description="Opaque asset commitments owned by your wallet. Raw datasets never leave the provider environment."
        actions={<Link href="/app/assets/new" className="pill-button">Register asset</Link>}
      />
      {!session ? (
        <SignedOutCard feature="Asset management" />
      ) : assets.length === 0 ? (
        <section className="rounded-[1.75rem] bg-white p-8">
          <h2 className="text-xl font-semibold tracking-tight">No assets yet</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#6f6f74]">
            Register a synthetic demo partition to create an on-chain asset commitment.
            Each partition can be used by one active asset.
          </p>
          <Link href="/app/assets/new" className="pill-button mt-5">Register your first asset</Link>
        </section>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {assets.map((asset) => (
            <Link
              key={asset.id}
              href={`/app/assets/${asset.id}`}
              className="rounded-[1.75rem] bg-white p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{asset.displayName}</p>
                  <p className="mt-1 text-xs text-[#8a8a8f]">Partition {asset.demoPartitionId}</p>
                </div>
                <StatusBadge tone={tone(asset.status)}>{asset.status.replace("_", " ")}</StatusBadge>
              </div>
              <p className="mt-4 break-all font-mono text-[10px] text-[#9a9aa0]">{asset.chainAssetId}</p>
              <p className="mt-3 text-xs text-[#6f6f74]">{asset.description ?? "No description"}</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
