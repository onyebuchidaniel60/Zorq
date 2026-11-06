import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { BackLink } from "@/components/back-link";
import { StatusBadge } from "@/components/status-badge";
import { SignedOutCard } from "@/components/wallet/signed-out-card";
import { RevokeLicenseButton } from "@/components/licenses/revoke-license-button";
import { Icon } from "@/components/ui-icon";
import { getSessionFromCookies } from "@/server/auth/session";
import { getLicense } from "@/server/domain/licenses";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "License detail" };

export default async function LicenseDetailPage({
  params,
}: {
  params: Promise<{ licenseId: string }>;
}) {
  const session = await getSessionFromCookies();
  const { licenseId } = await params;
  if (!session) {
    return (
      <>
        <BackLink href="/app/licenses" label="Back to licenses" />
        <PageHeader
          eyebrow="DataLicense"
          title="License detail"
          description="Connect your wallet to view this license."
        />
        <SignedOutCard feature="License detail" />
      </>
    );
  }

  let result;
  try {
    result = await getLicense(licenseId, session.walletAddress);
  } catch {
    notFound();
  }
  const { license, job, isOwner } = result!;
  const tone =
    license.statusMirror === "active"
      ? "success"
      : license.statusMirror === "revoked"
        ? "danger"
        : "warning";

  return (
    <>
      <BackLink href="/app/licenses" label="Back to licenses" />
      <PageHeader
        eyebrow="DataLicense"
        title={`License #${license.tokenId ?? "pending"}`}
        description="A non-transferable, job-scoped right to contribute one asset to one federated-learning job."
        actions={
          <StatusBadge tone={tone}>
            {license.statusMirror === "pending_chain"
              ? "pending"
              : license.statusMirror.replace("_", " ")}
          </StatusBadge>
        }
      />
      <div className="z-detail-grid">
        <section className="z-card z-detail-card">
          <div className="z-card-header z-card-header-tight">
            <div>
              <p className="z-eyebrow">License record</p>
              <h2 className="z-title-md">Terms and provenance</h2>
            </div>
            <span className="z-chip z-chip-muted">ERC-721</span>
          </div>
          <dl className="z-kv">
            <div>
              <dt>Job</dt>
              <dd>{job.title}</dd>
            </div>
            <div>
              <dt>Revision</dt>
              <dd>{license.revision}</dd>
            </div>
            <div>
              <dt>Valid from</dt>
              <dd>{new Date(license.validFrom).toLocaleString()}</dd>
            </div>
            <div>
              <dt>Valid until</dt>
              <dd>{new Date(license.validUntil).toLocaleString()}</dd>
            </div>
            <div>
              <dt>Asset reference</dt>
              <dd>
                <code>{license.assetId}</code>
              </dd>
            </div>
            {license.chainTxHash ? (
              <div>
                <dt>Chain transaction</dt>
                <dd>
                  <code>{license.chainTxHash}</code>
                  <span className="mt-1 block text-[10px] text-[#727969]">
                    Block {license.chainBlockNumber}
                  </span>
                </dd>
              </div>
            ) : null}
          </dl>
          <div className="z-alert z-alert-info mt-5">
            <Icon name="clock" className="mt-0.5 size-4 shrink-0" />
            <p>
              Revocation affects the next round snapshot. A round already admitted
              may finish. The token cannot be transferred or approved.
            </p>
          </div>
        </section>

        <aside className="z-stack">
          <section className="z-card z-side-card">
            <div className="z-card-header z-card-header-tight">
              <div>
                <p className="z-eyebrow">Owner action</p>
                <h2 className="z-title-md">Revocation</h2>
              </div>
              <Icon name="lock" className="size-4 text-[#727969]" />
            </div>
            {isOwner && license.statusMirror === "active" && license.tokenId ? (
              <RevokeLicenseButton licenseId={license.id} tokenId={license.tokenId} />
            ) : (
              <p className="z-copy">
                {license.statusMirror === "revoked"
                  ? "Revocation is terminal for this token."
                  : "No action is available for this license."}
              </p>
            )}
          </section>
          <section className="z-card z-side-card">
            <p className="z-eyebrow">Rule</p>
            <p className="z-copy mt-2">
              A revocation after a snapshot does not cancel that round. The next
              snapshot must exclude the token before another round starts.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
