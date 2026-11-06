import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { SignedOutCard } from "@/components/wallet/signed-out-card";
import { RevokeLicenseButton } from "@/components/licenses/revoke-license-button";
import { getSessionFromCookies } from "@/server/auth/session";
import { getLicense } from "@/server/domain/licenses";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "License detail" };

export default async function LicenseDetailPage({ params }: { params: Promise<{ licenseId: string }> }) {
  const session = await getSessionFromCookies();
  const { licenseId } = await params;
  if (!session) {
    return (
      <>
        <PageHeader eyebrow="DataLicense" title="License detail" description="Connect your wallet to view this license." />
        <SignedOutCard feature="License detail" />
      </>
    );
  }
  let result;
  try { result = await getLicense(licenseId, session.walletAddress); } catch { notFound(); }
  const { license, job, isOwner } = result!;
  const tone = license.statusMirror === "active" ? "success" : license.statusMirror === "revoked" ? "danger" : "warning";

  return (
    <>
      <PageHeader
        eyebrow="DataLicense"
        title={`License #${license.tokenId ?? "pending"}`}
        description="A non-transferable, job-scoped right to contribute one asset to one federated-learning job."
        actions={<StatusBadge tone={tone}>{license.statusMirror.replace("_", " ")}</StatusBadge>}
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="rounded-[1.75rem] bg-white p-6 sm:p-8">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-[#8a8a8f]">Job</dt><dd className="mt-1">{job.title}</dd></div>
            <div><dt className="text-xs text-[#8a8a8f]">Revision</dt><dd className="mt-1">{license.revision}</dd></div>
            <div><dt className="text-xs text-[#8a8a8f]">Valid from</dt><dd className="mt-1">{new Date(license.validFrom).toLocaleString()}</dd></div>
            <div><dt className="text-xs text-[#8a8a8f]">Valid until</dt><dd className="mt-1">{new Date(license.validUntil).toLocaleString()}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs text-[#8a8a8f]">Asset reference</dt><dd className="mt-1 break-all font-mono text-xs">{license.assetId}</dd></div>
            {license.chainTxHash ? <div className="sm:col-span-2"><dt className="text-xs text-[#8a8a8f]">Chain transaction</dt><dd className="mt-1 break-all font-mono text-xs">{license.chainTxHash} · block {license.chainBlockNumber}</dd></div> : null}
          </dl>
          <p className="mt-6 rounded-2xl bg-[#f7f7f8] p-4 text-xs leading-5 text-[#6f6f74]">
            Revocation affects the next round snapshot. A round already admitted may finish.
            The token cannot be transferred or approved.
          </p>
        </section>
        <aside className="space-y-4">
          <div className="rounded-[1.75rem] bg-white p-6">
            <h2 className="text-base font-semibold">Owner action</h2>
            {isOwner && license.statusMirror === "active" && license.tokenId ? (
              <div className="mt-3"><RevokeLicenseButton licenseId={license.id} tokenId={license.tokenId} /></div>
            ) : <p className="mt-2 text-sm text-[#6f6f74]">{license.statusMirror === "revoked" ? "Revocation is terminal for this token." : "No action available."}</p>}
          </div>
        </aside>
      </div>
    </>
  );
}
