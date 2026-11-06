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
    body: "An opaque asset reference and salted commitment. The raw dataset never leaves the provider.",
  },
  {
    number: "02",
    title: "Publish a training job",
    body: "A public purpose, fixed model configuration and bounded training window.",
  },
  {
    number: "03",
    title: "Issue a DataLicense",
    body: "A non-transferable ERC-721 binds one asset to one job for one validity interval.",
  },
  {
    number: "04",
    title: "Check every round",
    body: "The coordinator reads contract authorization at one confirmed block per round.",
  },
];

export default function HomePage() {
  return (
    <div className="public-page">
      <section className="landing-hero">
        <div className="landing-hero-top">
          <div className="landing-kicker">
            <StatusBadge tone="success">Portaldot testnet</StatusBadge>
            <StatusBadge tone="neutral">Synthetic data only</StatusBadge>
            <StatusBadge tone="warning">Experimental prototype</StatusBadge>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#727969]">
            Chain 420420777
          </p>
        </div>

        <h1 className="landing-title text-balance">
          Authorization that <em>expires</em> with the job.
        </h1>
        <p className="landing-lede">
          Zorq is programmable authorization for federated learning. A
          non-transferable DataLicense binds one asset to one job, one purpose,
          one model configuration and one validity window. The coordinator checks
          authoritative contract state at every round boundary.
        </p>

        <div className="landing-actions">
          <Link href="/app" className="z-button">
            Open the app
          </Link>
          <Link href="/docs" className="z-button-secondary">
            Read documentation
          </Link>
        </div>

        <div className="landing-stats">
          <div className="landing-stat">
            <p>420420777</p>
            <p>Portaldot V3 chain ID</p>
          </div>
          <div className="landing-stat">
            <p>3 rounds</p>
            <p>Fixed FedAvg demonstration</p>
          </div>
          <div className="landing-stat landing-stat-lime">
            <p>1 snapshot</p>
            <p>One confirmed authorization block per round</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="how-it-works" className="landing-grid">
        <div className="landing-card">
          <p className="z-eyebrow">How it works</p>
          <h2 id="how-it-works" className="z-title-lg mt-2">
            Authorization coupled to the execution checkpoint
          </h2>
          <ol className="mt-6">
            {steps.map((step) => (
              <li key={step.number} className="landing-step">
                <span className="landing-step-number">{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-4">
          <section className="landing-card">
            <p className="z-eyebrow">A license binds</p>
            <ul className="landing-list">
              {[
                "One registered data asset",
                "One specific federated-learning job",
                "The job's purpose hash",
                "The fixed model-configuration hash",
                "An explicit [validFrom, validUntil) window",
                "The asset owner's wallet",
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section className="landing-card">
            <p className="z-eyebrow">Boundary conditions</p>
            <h2 className="z-title-md mt-2">What this prototype does not claim</h2>
            <p className="z-copy mt-2">
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
