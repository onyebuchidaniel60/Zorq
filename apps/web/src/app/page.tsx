import Link from "next/link";
import type { Metadata } from "next";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Job-specific DataLicenses for federated learning",
};

const steps = [
  {
    number: "01",
    title: "Register a data asset",
    body: "A provider registers an opaque asset reference and a salted metadata commitment. The raw dataset never leaves the provider environment.",
  },
  {
    number: "02",
    title: "Publish a training job",
    body: "A researcher publishes a purpose statement, a fixed model configuration and a bounded training window.",
  },
  {
    number: "03",
    title: "Issue a DataLicense",
    body: "The asset owner mints a non-transferable ERC-721 that binds one asset to one job for one validity interval.",
  },
  {
    number: "04",
    title: "Check every round",
    body: "The coordinator reads contract authorization at one confirmed block before each round. Revocation after a snapshot applies to the next round.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <section className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="warning">Testnet prototype</StatusBadge>
            <StatusBadge tone="neutral">Synthetic data only</StatusBadge>
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
            Permission for a dataset should expire with the job, not outlive it.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            Zorq is programmable authorization for federated machine learning. A
            non-transferable DataLicense binds one asset to one job, one purpose
            commitment, one model configuration and one validity interval. The
            execution coordinator checks the authoritative contract state at
            every round boundary.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/app"
              className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
            >
              Explore the app shell
            </Link>
            <Link
              href="/docs"
              className="rounded-md border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-accent"
            >
              Read the documentation
            </Link>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">
            Wallet connection, on-chain registration and Flower training are
            delivered in later phases. The current preview is an honest
            navigable shell, not a working demo.
          </p>
        </div>

        <aside className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-strong">
            What the license binds
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6">
            {[
              "One registered data asset",
              "One specific federated-learning job",
              "The job's purpose hash",
              "The fixed model-configuration hash",
              "An explicit [validFrom, validUntil) window",
              "The asset owner's wallet",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-muted">
            The license is a right to participate in one computation. It is not
            a general right to access, download or resell the dataset.
          </div>
        </aside>
      </section>

      <section aria-labelledby="how-it-works" className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-strong">
              How it works
            </p>
            <h2 id="how-it-works" className="mt-2 text-2xl font-semibold tracking-tight">
              Authorization coupled to the execution checkpoint
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted">
            The contract is authoritative. Postgres mirrors metadata and audit
            history; it cannot grant a right the chain has denied.
          </p>
        </div>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <li key={step.number} className="rounded-xl border border-border bg-surface p-5">
              <p className="font-mono text-xs font-semibold text-accent">{step.number}</p>
              <h3 className="mt-3 text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="boundaries" className="mt-16 rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h2 id="boundaries" className="text-xl font-semibold tracking-tight">
          What this prototype does not claim
        </h2>
        <div className="mt-4 grid gap-3 text-sm leading-6 text-muted md:grid-cols-2">
          <p>
            It does not accept real patient, banking, insurance or customer
            data. All demonstrations use generated synthetic partitions.
          </p>
          <p>
            It does not claim native Portaldot federated-learning, ZKP,
            homomorphic-encryption, differential-privacy or secure-aggregation
            integration.
          </p>
          <p>
            Federated learning is not automatically privacy preserving. Model
            updates can leak information and can be poisoned.
          </p>
          <p>
            There are no payments, no marketplace, no token, no production SLA
            and no mainnet deployment.
          </p>
        </div>
      </section>
    </div>
  );
}
