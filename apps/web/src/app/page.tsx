import Link from "next/link";
import type { Metadata } from "next";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Job-specific DataLicenses for federated learning",
};

const steps = [
  { number: "01", title: "Register a data asset", body: "An opaque asset reference and salted commitment. The raw dataset never leaves the provider." },
  { number: "02", title: "Publish a training job", body: "A public purpose, fixed model configuration and bounded training window." },
  { number: "03", title: "Issue a DataLicense", body: "A non-transferable ERC-721 binds one asset to one job for one validity interval." },
  { number: "04", title: "Check every round", body: "The coordinator reads contract authorization at one confirmed block per round." },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <section className="rounded-[2rem] bg-white px-6 py-10 sm:px-10 sm:py-14">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="success">Portaldot testnet</StatusBadge>
          <StatusBadge tone="neutral">Synthetic data only</StatusBadge>
          <StatusBadge tone="warning">Experimental prototype</StatusBadge>
        </div>
        <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-black sm:text-6xl">
          Permission for a dataset should expire with the job, not outlive it.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-[#6f6f74]">
          Zorq is programmable authorization for federated learning. A
          non-transferable DataLicense binds one asset to one job, one purpose,
          one model configuration and one validity window. The coordinator
          checks authoritative contract state at every round boundary.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/app" className="pill-button">Open the app</Link>
          <Link href="/docs" className="pill-button-secondary">Read documentation</Link>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl bg-[#f7f7f8] p-5">
            <p className="text-3xl font-semibold tracking-tight">420420777</p>
            <p className="mt-1 text-xs text-[#8a8a8f]">Portaldot V3 chain ID</p>
          </div>
          <div className="rounded-3xl bg-[#f7f7f8] p-5">
            <p className="text-3xl font-semibold tracking-tight">3 rounds</p>
            <p className="mt-1 text-xs text-[#8a8a8f]">Fixed FedAvg demonstration</p>
          </div>
          <div className="rounded-3xl bg-[#dff3e6] p-5">
            <p className="text-3xl font-semibold tracking-tight">1 snapshot</p>
            <p className="mt-1 text-xs text-[#2d6a4a]">One confirmed authorization block per round</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="how-it-works" className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] bg-white p-6 sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a8a8f]">How it works</p>
          <h2 id="how-it-works" className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
            Authorization coupled to the execution checkpoint
          </h2>
          <ol className="mt-6 space-y-4">
            {steps.map((step) => (
              <li key={step.number} className="flex gap-4 rounded-3xl bg-[#f7f7f8] p-4">
                <span className="font-mono text-[11px] font-semibold text-[#8a8a8f]">{step.number}</span>
                <div>
                  <h3 className="text-sm font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#6f6f74]">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-5">
          <section className="rounded-[2rem] bg-white p-6 sm:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a8a8f]">A license binds</p>
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
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-black" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-[2rem] bg-[#f7f7f8] p-6 sm:p-8">
            <h2 className="text-lg font-semibold tracking-tight">What this prototype does not claim</h2>
            <p className="mt-2 text-sm leading-6 text-[#6f6f74]">
              No real patient, banking or customer data. No native Portaldot FL,
              ZKP, HE, differential-privacy or secure-aggregation integration.
              Federated learning is not automatically privacy preserving.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
