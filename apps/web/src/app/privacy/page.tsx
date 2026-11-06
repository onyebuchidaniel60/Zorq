import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What the Zorq testnet deployment stores and what it never collects.",
};

export default function PrivacyPage() {
  return (
    <div className="public-page max-w-4xl">
      <PageHeader
        eyebrow="Privacy"
        title="Privacy and data handling"
        description="Accurate to the current implementation: evaluation data only, no raw dataset uploads and no analytics vendor."
        variant="public"
        />
      <div className="legal-layout">
        <section className="doc-section">
          <h2>What Zorq stores</h2>
          <ul>
            <li>Wallet address and optional display name for authenticated users.</li>
            <li>Short-lived SIWE nonces and session cookies.</li>
            <li>Asset display metadata, salted metadata commitments and opaque on-chain identifiers.</li>
            <li>Job descriptions, purpose commitments, model configuration and time windows.</li>
            <li>License lifecycle mirrors, verified chain transactions and audit events.</li>
            <li>Run status, aggregate metrics and final model hash. No per-client raw updates are retained.</li>
          </ul>
        </section>
        <section className="doc-section">
          <h2>What Zorq does not collect</h2>
          <ul>
            <li>Raw datasets, dataset files, real personal, medical or financial records.</li>
            <li>Private keys or seed phrases. Wallet actions are signed in the user&apos;s wallet.</li>
            <li>Payment information or production customer data.</li>
            <li>Third-party analytics or advertising identifiers.</li>
          </ul>
        </section>
        <section className="doc-section">
          <h2>Public chain data</h2>
          <p>
            Wallet addresses, contract events, token IDs and transaction hashes are
            public on the Portaldot testnet. Do not use this deployment with a wallet
            whose public association you are not prepared to disclose. Asset display
            names and descriptions are kept off-chain and are visible only to the
            owning wallet in the application.
          </p>
        </section>
        <section className="doc-section">
          <h2>Retention</h2>
          <p>
            Expired nonces and idempotency records are removed after their short
            retention window. Audit events, verified transaction metadata and run
            summaries are retained for evaluation. Evaluation training
            partitions are generated at runtime and are not uploaded.
          </p>
        </section>
        <p className="text-xs leading-5 text-[#5f6755]">
          This page describes an experimental testnet deployment. It is not a
          compliance certification or legal advice. Do not submit regulated data.
        </p>
      </div>
    </div>
  );
}
