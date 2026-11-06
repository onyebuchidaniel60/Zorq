import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { SignedOutCard } from "@/components/wallet/signed-out-card";
import { getSessionFromCookies } from "@/server/auth/session";
import { listLicenses } from "@/server/domain/licenses";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Data licenses" };

function tone(status: string) {
  if (status === "active") return "success" as const;
  if (status === "revoked") return "danger" as const;
  if (status === "expired") return "neutral" as const;
  return "warning" as const;
}

export default async function LicensesPage() {
  const session = await getSessionFromCookies();
  const rows = session ? await listLicenses(session.walletAddress) : [];

  return (
    <>
      <PageHeader
        eyebrow="Data provider"
        title="Data licenses"
        description="Non-transferable rights issued by your wallet for one asset and one job."
      />
      {!session ? (
        <SignedOutCard feature="License management" />
      ) : rows.length === 0 ? (
        <section className="z-card z-side-card">
          <div className="z-empty">
            <h2 className="z-title-md">No licenses yet</h2>
            <p className="z-copy max-w-xl">
              Open a job and issue a license for one of your active data assets.
              Revocation is terminal for that token.
            </p>
            <Link href="/app/jobs" className="z-button mt-2">
              Browse jobs
            </Link>
          </div>
        </section>
      ) : (
        <section className="z-card">
          <div className="z-card-header">
            <div>
              <p className="z-eyebrow">Rights registry</p>
              <h2 className="z-title-md">Issued licenses</h2>
            </div>
            <span className="z-chip z-chip-muted">{rows.length} tokens</span>
          </div>
          <div className="z-table-wrap">
            <table className="z-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Status</th>
                  <th>Validity</th>
                  <th>Revision</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((license) => (
                  <tr key={license.id} className="z-table-row-link">
                    <td>
                      <Link
                        href={`/app/licenses/${license.id}`}
                        className="block text-[#f3f5ed] font-semibold"
                      >
                        License #{license.tokenId ?? "pending"}
                      </Link>
                      <span className="mt-0.5 block font-mono text-[10px] text-[#727969]">
                        asset {license.assetId.slice(0, 8)}…
                      </span>
                    </td>
                    <td>
                      <StatusBadge tone={tone(license.statusMirror)}>
                        {license.statusMirror.replace("_", " ")}
                      </StatusBadge>
                    </td>
                    <td className="text-[11px]">
                      {new Date(license.validFrom).toLocaleDateString()} →{" "}
                      {new Date(license.validUntil).toLocaleDateString()}
                    </td>
                    <td>{license.revision}</td>
                    <td>
                      <Link className="z-link text-xs" href={`/app/licenses/${license.id}`}>
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
