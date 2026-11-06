import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Support",
  description: "Troubleshooting and issue reporting for the Zorq testnet prototype.",
};

const issues = [
  {
    title: "Wallet connection is unavailable",
    body: "Use polkadot.js, Talisman or SubWallet with an unlocked Substrate account. The app derives your H160 identity from the SS58 account, then asks for a SIWE signature. Signing in does not send a transaction.",
  },
  {
    title: "The wallet has no testnet POT",
    body: "Registering an asset, publishing a job, issuing a license and revoking a license are testnet transactions. The wallet needs testnet POT for gas and storage deposits. No mainnet assets are used.",
  },
  {
    title: "A partition is already in use",
    body: "Only one asset can reserve each synthetic partition (0–4). The registration form reads reserved partitions from the database and disables them. The server still rejects a conflicting submission safely if another wallet takes it first.",
  },
  {
    title: "Wrong network or origin",
    body: "The application expects Portaldot V3 testnet, chain ID 420420777, and an official Zorq deployment URL. If sign-in reports an origin mismatch, use https://zorq-preview-uhhh2.vercel.app or https://zorq-six.vercel.app rather than a deployment-specific hostname.",
  },
  {
    title: "A transaction is pending or failed",
    body: "Testnet RPC availability can vary. Do not retry by sending a second transaction blindly. The app now surfaces a readable rejection, empty-response or confirmation error instead of a JavaScript crash.",
  },
];

export default function SupportPage() {
  return (
    <div className="public-page max-w-4xl">
      <PageHeader
        eyebrow="Support"
        title="Help and issue reporting"
        description="Known prototype limitations and the verified place to report a problem."
        variant="public"
        />
      <div className="legal-layout">
        {issues.map((issue) => (
          <section key={issue.title} className="doc-section">
            <h2>{issue.title}</h2>
            <p>{issue.body}</p>
          </section>
        ))}
        <section className="doc-section">
          <h2>Report an issue</h2>
          <p>
            Use the public repository issue tracker. Do not include seed phrases,
            private keys, session cookies, API keys or real personal data in an
            issue.
          </p>
          <a
            className="z-button mt-4"
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
