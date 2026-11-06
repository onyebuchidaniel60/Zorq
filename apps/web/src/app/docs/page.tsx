import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "How Zorq DataLicenses, federated-learning jobs, round snapshots and revocation semantics work.",
};

type DocsSection = {
  id: string;
  title: string;
  body: string;
  points?: string[];
};

const sections: DocsSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "Zorq is a programmable authorization layer for federated machine learning. A data owner grants one asset the right to participate in one training job for a bounded time window. The right is represented by a non-transferable ERC-721 DataLicense on the Portaldot V3 EVM testnet. The deployed contract is 0xa9ab18d404e2cd19c23f30e7d78a740b562685ff.",
  },
  {
    id: "architecture",
    title: "Architecture",
    body: "The browser talks only to the Next.js application. Server routes validate the SIWE session, read and write PostgreSQL, and read the Portaldot contract through the EVM RPC. The Flower coordinator calls the application's internal API and never connects directly to the database.",
    points: [
      "Next.js App Router serves the UI and domain APIs.",
      "PostgreSQL stores users, nonces, metadata, audit events and run mirrors.",
      "ZorqRegistry is the authoritative source for assets, jobs, licenses and authorization.",
      "The FL service consumes internal snapshots and reports aggregate progress.",
      "Wallet keys stay in the user's Substrate extension.",
    ],
  },
  {
    id: "external-databases",
    title: "External databases",
    body: "Asset registration supports generated demo partitions or a read-only external PostgreSQL table. External connection URLs are encrypted at rest and are never returned by browser-facing APIs. The coordinator decrypts the reference only for the internal authorization snapshot.",
    points: [
      "PostgreSQL URLs, table names and target-label columns are validated server-side.",
      "The coordinator reads at most 1,000 rows with SQLAlchemy and pandas.",
      "Up to eight numeric columns become model features; the label is normalized to a binary target.",
      "Raw rows are discarded after training and are never written to Zorq storage.",
      "A failed external connection marks that participant as a data failure and skips it without crashing the run.",
    ],
  },
  {
    id: "license-lifecycle",
    title: "License lifecycle",
    body: "A license is issued by the registered asset owner, bound to a single job and valid only inside [validFrom, validUntil). It can be revoked by the owner; revocation is terminal for that token. A later revision may be issued after revocation or expiry while the asset and job remain eligible.",
    points: [
      "Only the asset owner can issue or revoke the asset's license.",
      "The token cannot be transferred or approved.",
      "The validity interval uses on-chain block time.",
      "A closed job is terminal.",
    ],
  },
  {
    id: "round-snapshots",
    title: "Round snapshots",
    body: "Before admission and before every training round, the coordinator asks the Zorq backend for one authorization snapshot. All candidate licenses are read from the contract at one confirmed block number and hash. Only the returned allowlist may train and contribute to that round.",
    points: [
      "The same allowlist governs training and aggregation for that round.",
      "If the snapshot cannot be read or is ambiguous, the coordinator fails closed.",
      "The reference run completed three rounds; the final round admitted two authorized assets.",
    ],
  },
  {
    id: "revocation",
    title: "Revocation semantics",
    body: "A revocation mined after a round snapshot does not retroactively cancel that round. The participant is excluded at the next round boundary. If fewer than two distinct assets remain authorized, the next round does not start.",
  },
  {
    id: "authentication",
    title: "Authentication and sessions",
    body: "Wallet sign-in uses an EIP-4361 SIWE message signed with the Substrate account's sr25519 key. The server validates the message domain, URI, nonce, chain and expiry, verifies the signature against the stored SS58 public key, and maps the account to its chain-derived H160 identity.",
    points: [
      "Challenges are single-use and expire after five minutes.",
      "Sessions are HttpOnly, Secure and SameSite cookies with an eight-hour lifetime.",
      "Origin checks accept only explicit trusted deployment origins.",
      "PostgreSQL mirrors user metadata; the wallet remains the signing authority.",
    ],
  },
  {
    id: "api",
    title: "API surface",
    body: "The application exposes authenticated domain endpoints for assets, jobs, licenses and runs, plus token-protected internal endpoints for the FL coordinator.",
    points: [
      "POST /api/auth/nonce and POST /api/auth/verify create the SIWE session.",
      "GET and POST /api/assets manage asset drafts and confirmations.",
      "GET and POST /api/jobs manage jobs, licenses and run starts.",
      "GET /api/runs/{id} returns role-filtered run, round and authorization evidence.",
      "Internal run endpoints require FL_SERVICE_SHARED_SECRET and are not browser-reachable.",
    ],
  },
  {
    id: "local-development",
    title: "Local development",
    body: "Use Node.js 22.23.4, PostgreSQL and Python 3.12 with uv. The repository uses npm workspaces; the FL service has its own Python environment.",
    points: [
      "nvm use && npm install",
      "cp .env.example .env.local and fill the required values",
      "npm run db:migrate && npm run dev -- --port 3100",
      "npm --workspace @zorq/contracts test",
      "cd apps/fl-service && uv sync && uv run pytest -q",
    ],
  },
  {
    id: "deployment",
    title: "Deployment",
    body: "The web app runs on Vercel, PostgreSQL on Neon, and the Flower coordinator on Render. The contract is deployed to the Portaldot V3 EVM testnet. Preview and production use separate environment configuration and must never expose server-only values.",
    points: [
      "Contract: 0xa9ab18d404e2cd19c23f30e7d78a740b562685ff",
      "Deployment block: 337014",
      "Reference run: e18c1749-21f4-4cf4-b74a-2ed107f5d6cf",
      "Revocation excluded at snapshot block 341656",
    ],
  },
  {
    id: "testing",
    title: "Testing",
    body: "The verification suite covers the contract, FL coordinator, authentication, domain APIs, client parsing and responsive browser routes.",
    points: [
      "Solidity tests: 11/11",
      "FL service tests: 7/7",
      "Web unit and scaffold tests: 27/27 + 4/4",
      "Playwright desktop + mobile: 40/40",
      "Deployed sign-in and data-page smoke: pass",
    ],
  },
  {
    id: "limitations",
    title: "Scope and limitations",
    body: "This deployment uses evaluation data only. It does not accept uploads or real regulated data. Flower is an execution adapter, not native Portaldot FL. No ZKP, HE, differential-privacy or secure-aggregation claim is made. Preview deployments are testnet-only and noindex.",
  },
];

export default function DocsPage() {
  return (
    <div className="public-page">
      <PageHeader
        eyebrow="Documentation"
        title="How Zorq works"
        description="The authorization model, contract boundary, round snapshots, API surface and operating limits of the Portaldot deployment."
        actions={<StatusBadge tone="warning">Living documentation</StatusBadge>}
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
              {section.points ? (
                <ul>
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          <section className="doc-section">
            <h2>Deployment status</h2>
            <p>
              Asset registration, job creation, license issuance/revocation and
              the three-round Flower training flow are live on the Portaldot V3
              testnet. Wallet-signed actions require a Substrate extension and
              testnet POT for gas/storage deposits.
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
              . Full setup, API, deployment and test documentation is in the
              repository under <code className="z-code">docs/</code>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
