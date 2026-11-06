import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "How Zorq DataLicenses, federated-learning jobs, round snapshots and revocation semantics work.",
};

const sections = [
  {
    id: "overview",
    title: "Overview",
    body: "Zorq is a programmable authorization layer for federated machine learning. A data owner grants one asset the right to participate in one training job for a bounded time window. The right is represented by a non-transferable ERC-721 DataLicense on the Portaldot V3 EVM testnet. The live demo contract is 0xa9ab18d404e2cd19c23f30e7d78a740b562685ff.",
  },
  {
    id: "license-lifecycle",
    title: "License lifecycle",
    body: "A license is issued by the registered asset owner, bound to a single job and valid only inside [validFrom, validUntil). It can be revoked by the owner; revocation is terminal for that token. A later revision may be issued after revocation or expiry while the asset and job remain eligible.",
  },
  {
    id: "round-snapshots",
    title: "Round snapshots",
    body: "Before admission and before every training round, the coordinator asks the Zorq backend for one authorization snapshot. All candidate licenses are read from the contract at one confirmed block number and hash. Only the returned allowlist may train and contribute to that round. The demo run completed three rounds; a license revoked after round 2's snapshot was denied at round 3.",
  },
  {
    id: "revocation",
    title: "Revocation semantics",
    body: "A revocation mined after a round snapshot does not retroactively cancel that round. The participant is excluded at the next round boundary. If fewer than two distinct assets remain authorized, the next round does not start.",
  },
  {
    id: "limitations",
    title: "Scope and limitations",
    body: "This prototype uses synthetic data only. It does not accept uploads or real regulated data. Flower is a demonstration execution adapter, not native Portaldot FL. No ZKP, HE, differential-privacy or secure-aggregation claim is made. Preview deployments are testnet-only and noindex.",
  },
];

export default function DocsPage() {
  return (
    <div className="public-page">
      <PageHeader
        eyebrow="Documentation"
        title="How Zorq works"
        description="A concise guide to the authorization model, round snapshots and the limits of this testnet prototype."
        actions={<StatusBadge tone="warning">Living prototype docs</StatusBadge>}
        variant="public"
        />

      <div className="doc-layout">
        <nav aria-label="Documentation sections" className="doc-nav">
          <p className="z-eyebrow">On this page</p>
          <ul className="mt-3 space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.title}</a>
              </li>
            ))}
            <li>
              <Link href="/app">Open the app</Link>
            </li>
          </ul>
        </nav>

        <div>
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="doc-section">
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}

          <section className="doc-section">
            <h2>Prototype status</h2>
            <p>
              Asset registration, job creation, license issuance/revocation and
              the three-round Flower demonstration are live on the Portaldot V3
              testnet. Only synthetic data is used. Wallet-signed actions require
              a Substrate extension and testnet POT for gas/storage deposits.
            </p>
            <p>
              Project source and issue tracking:{" "}
              <a
                className="z-link"
                href="https://github.com/onyebuchidaniel60/Zorq"
                rel="noreferrer"
                target="_blank"
              >
                github.com/onyebuchidaniel60/Zorq
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
