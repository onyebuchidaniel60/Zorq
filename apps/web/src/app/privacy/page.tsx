import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What the Zorq testnet prototype stores and what it never collects.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Privacy"
        title="Privacy and data handling"
        description="Accurate to the current implementation: synthetic data only, no raw dataset uploads and no analytics vendor."
      />
      <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground">What Zorq stores</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Wallet address and optional display name for authenticated users.</li>
            <li>Short-lived SIWE nonces and session cookies.</li>
            <li>Asset display metadata, salted metadata commitments and opaque on-chain identifiers.</li>
            <li>Job descriptions, purpose commitments, model configuration and time windows.</li>
            <li>License lifecycle mirrors, verified chain transactions and audit events.</li>
            <li>Run status, aggregate metrics and final model hash. No per-client raw updates are retained.</li>
          </ul>
        </section>
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground">What Zorq does not collect</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Raw datasets, dataset files, real personal, medical or financial records.</li>
            <li>Private keys or seed phrases. Wallet actions are signed in the user&apos;s wallet.</li>
            <li>Payment information or production customer data.</li>
            <li>Third-party analytics or advertising identifiers.</li>
          </ul>
        </section>
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground">Public chain data</h2>
          <p className="mt-3">
            Wallet addresses, contract events, token IDs and transaction hashes are
            public on the Portaldot testnet. Do not use this prototype with a wallet
            whose public association you are not prepared to disclose. Asset display
            names and descriptions are kept off-chain and are visible only to the
            owning wallet in the application.
          </p>
        </section>
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground">Retention</h2>
          <p className="mt-3">
            Expired nonces and idempotency records are removed after their short
            retention window. Audit events, verified transaction metadata and run
            summaries are retained for prototype evaluation. Synthetic training
            partitions are generated at runtime and are not uploaded.
          </p>
        </section>
        <p className="text-xs leading-5 text-muted">
          This page describes an experimental testnet prototype. It is not a
          compliance certification or legal advice. Do not submit regulated data.
        </p>
      </div>
    </div>
  );
}
