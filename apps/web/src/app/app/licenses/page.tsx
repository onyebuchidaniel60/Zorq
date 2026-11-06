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
        <section className="rounded-[1.75rem] bg-white p-8">
          <h2 className="text-xl font-semibold tracking-tight">No licenses yet</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#6f6f74]">
            Open a job and issue a license for one of your active synthetic assets.
            Revocation is terminal for that token.
          </p>
          <Link href="/app/jobs" className="pill-button mt-5">Browse jobs</Link>
        </section>
      ) : (
        <div className="grid gap-3">
          {rows.map((license) => (
            <Link key={license.id} href={`/app/licenses/${license.id}`} className="rounded-[1.75rem] bg-white p-5 transition-transform hover:-translate-y-0.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">License #{license.tokenId ?? "pending"} · revision {license.revision}</p>
                  <p className="mt-1 text-xs text-[#8a8a8f]">
                    {new Date(license.validFrom).toLocaleDateString()} → {new Date(license.validUntil).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge tone={tone(license.statusMirror)}>{license.statusMirror.replace("_", " ")}</StatusBadge>
              </div>
              <p className="mt-3 break-all font-mono text-[10px] text-[#9a9aa0]">asset {license.assetId}</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
