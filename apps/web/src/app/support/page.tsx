import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Support",
  description: "Troubleshooting and issue reporting for the Zorq testnet prototype.",
};

const issues = [
  {
    title: "The app says a feature is planned",
    body: "The prototype is delivered in phases. A control labelled Planned or Phase N is intentionally unavailable. It does not indicate an error and must not be treated as a completed action.",
  },
  {
    title: "Wallet connection is unavailable",
    body: "Wallet connection and SIWE sessions are delivered in Phase 2. Until then, the Connect Wallet control is disabled and clearly labelled.",
  },
  {
    title: "Wrong network",
    body: "The application expects Portaldot V3 testnet, chain ID 420420777. Do not send mainnet assets to any address shown by this prototype.",
  },
  {
    title: "A transaction is pending or failed",
    body: "Testnet RPC availability can vary. Never retry by sending a second transaction blindly; open the reported transaction hash in the verified explorer first. Later phases will show pending, confirmed and reverted states explicitly.",
  },
];

export default function SupportPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Support"
        title="Help and issue reporting"
        description="Known prototype limitations and the verified place to report a problem."
      />
      <div className="mt-8 space-y-4">
        {issues.map((issue) => (
          <section key={issue.title} className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-base font-semibold">{issue.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{issue.body}</p>
          </section>
        ))}
        <section className="rounded-xl border border-border bg-slate-50 p-6">
          <h2 className="text-base font-semibold">Report an issue</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Use the public repository issue tracker. Do not include seed phrases,
            private keys, session cookies, API keys or real personal data in an
            issue.
          </p>
          <a
            className="mt-3 inline-block rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            href="https://github.com/onyebuchidaniel60/Zorq/issues"
            rel="noreferrer"
            target="_blank"
          >
            Open GitHub issues
          </a>
        </section>
      </div>
    </div>
  );
}
