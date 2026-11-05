import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "App overview",
};

const summaries = [
  {
    label: "Owned assets",
    value: "—",
    note: "Registration is delivered in Phase 3.",
  },
  {
    label: "Open jobs",
    value: "—",
    note: "Job creation is delivered in Phase 3.",
  },
  {
    label: "Active licenses",
    value: "—",
    note: "License issuance is delivered in Phase 3.",
  },
  {
    label: "Recent runs",
    value: "—",
    note: "Flower orchestration is delivered in Phase 4.",
  },
];

const quickLinks = [
  { href: "/app/assets", label: "Assets", detail: "Register and manage synthetic asset commitments." },
  { href: "/app/jobs", label: "Jobs", detail: "Publish a fixed-preset federated-learning job." },
  { href: "/app/licenses", label: "Licenses", detail: "Issue, inspect and revoke job-bound rights." },
];

export default function AppOverviewPage() {
  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Your authorization workspace"
        description="This dashboard will summarize assets, jobs, licenses and training runs once wallet authentication and the domain APIs are connected."
        actions={<StatusBadge tone="neutral">Phase 1 shell</StatusBadge>}
      />

      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="sr-only">
          Workspace summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaries.map((summary) => (
            <div key={summary.label} className="rounded-xl border border-border bg-surface p-5">
              <p className="text-sm font-medium text-muted">{summary.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-400">
                {summary.value}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted">{summary.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="start-heading" className="rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="start-heading" className="text-lg font-semibold">
              Start here
            </h2>
            <p className="mt-1 text-sm text-muted">
              Pages are navigable now; mutations are intentionally disabled until
              the chain and API layers exist.
            </p>
          </div>
          <StatusBadge tone="warning">Not connected</StatusBadge>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-border p-4 transition-colors hover:border-accent"
            >
              <p className="font-semibold">{link.label}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{link.detail}</p>
              <p className="mt-3 text-xs font-semibold text-accent-strong">Open {link.label.toLowerCase()} →</p>
            </Link>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="evidence-heading"
        className="rounded-xl border border-dashed border-slate-300 bg-surface p-6"
      >
        <h2 id="evidence-heading" className="text-lg font-semibold">
          Chain and environment evidence
        </h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-muted">Network</dt>
            <dd className="mt-1 font-mono text-xs">Portaldot V3 testnet · 420420777</dd>
          </div>
          <div>
            <dt className="font-medium text-muted">Contract</dt>
            <dd className="mt-1 font-mono text-xs text-slate-500">Not deployed yet</dd>
          </div>
          <div>
            <dt className="font-medium text-muted">Last authorization snapshot</dt>
            <dd className="mt-1 text-xs text-slate-500">No runs recorded</dd>
          </div>
          <div>
            <dt className="font-medium text-muted">FL execution provider</dt>
            <dd className="mt-1 text-xs text-slate-500">Flower demo adapter · planned Phase 4</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
