import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { SignedOutCard } from "@/components/wallet/signed-out-card";
import { getSessionFromCookies } from "@/server/auth/session";
import { getAssetForOwner } from "@/server/domain/assets";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Asset detail" };

export default async function AssetDetailPage({ params }: { params: Promise<{ assetId: string }> }) {
  const session = await getSessionFromCookies();
  const { assetId } = await params;
  if (!session) return <SignedOutCard feature="Asset detail" />;
  let asset;
  try { asset = await getAssetForOwner(assetId, session.walletAddress); } catch { notFound(); }

  return (
    <>
      <PageHeader
        eyebrow="Data asset"
        title={asset!.displayName}
        description={asset!.description ?? "Owner-only synthetic asset metadata."}
        actions={<StatusBadge tone={asset!.status === "active" ? "success" : "neutral"}>{asset!.status}</StatusBadge>}
      />
      <section className="rounded-[1.75rem] bg-white p-6 sm:p-8">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-[#8a8a8f]">Synthetic partition</dt><dd className="mt-1">{asset!.demoPartitionId}</dd></div>
          <div><dt className="text-xs text-[#8a8a8f]">Registered</dt><dd className="mt-1">{new Date(asset!.createdAt).toLocaleString()}</dd></div>
          <div className="sm:col-span-2"><dt className="text-xs text-[#8a8a8f]">On-chain asset ID</dt><dd className="mt-1 break-all font-mono text-xs">{asset!.chainAssetId}</dd></div>
          <div className="sm:col-span-2"><dt className="text-xs text-[#8a8a8f]">Metadata commitment</dt><dd className="mt-1 break-all font-mono text-xs">{asset!.metadataCommitment}</dd></div>
          {asset!.chainTxHash ? <div className="sm:col-span-2"><dt className="text-xs text-[#8a8a8f]">Registration transaction</dt><dd className="mt-1 break-all font-mono text-xs">{asset!.chainTxHash} · block {asset!.chainBlockNumber}</dd></div> : null}
        </dl>
        <p className="mt-6 rounded-2xl bg-[#f7f7f8] p-4 text-xs leading-5 text-[#6f6f74]">
          A commitment is integrity evidence, not encryption. The raw synthetic partition never leaves the worker runtime.
        </p>
      </section>
    </>
  );
}
