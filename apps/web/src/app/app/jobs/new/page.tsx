import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Create a training job",
};

const preset = [
  ["Model preset", "synthetic-binary-classifier-v1"],
  ["Input", "8 numeric features"],
  ["Model", "torch.nn.Linear(8, 1) logit output"],
  ["Loss / optimiser", "BCEWithLogitsLoss / SGD, lr 0.05"],
  ["Local training", "Batch 32 · 2 epochs per round"],
  ["Rounds", "3 · FedAvg weighted by local examples"],
  ["Minimum cohort", "2 distinct authorized assets"],
];

export default function NewJobPage() {
  return (
    <>
      <PageHeader
        eyebrow="Researcher"
        title="Create a training job"
        description="Define a public purpose and bounded training window. The model preset and configuration hash are fixed and cannot be tuned in this MVP."
        actions={<StatusBadge tone="warning">Form preview · Phase 3</StatusBadge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <form className="rounded-xl border border-border bg-surface p-6" aria-describedby="job-form-note">
          <fieldset disabled className="space-y-5 opacity-70">
            <legend className="text-base font-semibold">Job details</legend>
            <div>
              <label htmlFor="job-title" className="block text-sm font-medium">
                Title
              </label>
              <input
                id="job-title"
                name="title"
                type="text"
                placeholder="e.g. Synthetic binary classifier demo"
                className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="job-description" className="block text-sm font-medium">
                Public description
              </label>
              <textarea
                id="job-description"
                name="description"
                rows={3}
                maxLength={1000}
                className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="job-purpose" className="block text-sm font-medium">
                Purpose statement
              </label>
              <textarea
                id="job-purpose"
                name="purposeText"
                rows={3}
                minLength={20}
                maxLength={500}
                placeholder="State the public purpose of this training computation."
                className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-muted">
                Normalized and hashed; the hash is published on-chain. 20–500 characters.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="job-start" className="block text-sm font-medium">
                  Starts at
                </label>
                <input
                  id="job-start"
                  name="startsAt"
                  type="datetime-local"
                  className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="job-end" className="block text-sm font-medium">
                  Ends at
                </label>
                <input
                  id="job-end"
                  name="endsAt"
                  type="datetime-local"
                  className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="job-max" className="block text-sm font-medium">
                Maximum participant cohort
              </label>
              <select
                id="job-max"
                name="maxParticipants"
                className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
              >
                <option value="2">2 distinct assets</option>
                <option value="3">3 distinct assets</option>
                <option value="4">4 distinct assets</option>
                <option value="5">5 distinct assets</option>
              </select>
              <p className="mt-1 text-xs text-muted">
                Lifetime distinct-asset cap. Revocation does not free a slot for a different asset.
              </p>
            </div>
          </fieldset>
          <p id="job-form-note" className="mt-5 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            Disabled until the Phase 3 draft, hash-canonicalization and on-chain
            confirmation flow exists. This form cannot publish a job today.
          </p>
        </form>

        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-base font-semibold">Fixed model configuration</h2>
            <dl className="mt-3 space-y-2 text-xs">
              {preset.map(([term, value]) => (
                <div key={term}>
                  <dt className="font-medium text-muted">{term}</dt>
                  <dd className="font-mono break-words text-slate-700">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <PlaceholderPanel title="Publish transaction" phase="Phase 3">
            The wallet will sign{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">
              createJob(jobId, purposeHash, modelConfigHash, startsAt, endsAt,
              maxParticipants)
            </code>
            . The backend verifies the event and current chain state before the
            job is visible as open.
          </PlaceholderPanel>
        </div>
      </div>
    </>
  );
}
