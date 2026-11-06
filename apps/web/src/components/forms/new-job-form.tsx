"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/wallet-context";
import { contractAddress, getContractClients } from "@/lib/wallet-client";
import {
  readApiError,
  readJsonObject,
  transactionHash,
  userFacingError,
} from "@/lib/client-api";
import { ZORQ_REGISTRY_ABI } from "@/server/chain/zorq-registry-abi";

type Draft = {
  jobId: string;
  chainJobId: `0x${string}`;
  purposeHash: `0x${string}`;
  modelConfigHash: `0x${string}`;
  args: [string, string, string, number, number, number];
};

function localInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isDraft(value: Draft): boolean {
  if (
    typeof value.jobId !== "string" ||
    typeof value.chainJobId !== "string" ||
    typeof value.purposeHash !== "string" ||
    typeof value.modelConfigHash !== "string" ||
    !Array.isArray(value.args) ||
    value.args.length !== 6
  ) {
    return false;
  }
  return value.args.slice(3).every((item) => Number.isFinite(Number(item)));
}

export function NewJobForm() {
  const router = useRouter();
  const { wallet, user, connect } = useWallet();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [purposeText, setPurposeText] = useState("");
  const [startsAt, setStartsAt] = useState(() => localInput(new Date(Date.now() - 60_000)));
  const [endsAt, setEndsAt] = useState(() =>
    localInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  );
  const [maxParticipants, setMaxParticipants] = useState(3);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !wallet) {
      setError("Connect and sign in with your wallet first.");
      return;
    }
    setError(null);

    try {
      setStatus("Preparing the job draft…");
      const response = await fetch("/api/jobs/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          purposeText,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          maxParticipants,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, "The job draft could not be created."));
      }
      const draft = await readJsonObject<Draft>(
        response,
        "The job draft response was empty. Nothing was submitted.",
      );
      if (!isDraft(draft)) {
        throw new Error("The job draft response was incomplete. Nothing was submitted.");
      }

      setStatus("Confirm the transaction in your wallet…");
      const { walletClient, publicClient } = await getContractClients(wallet);
      const hash = transactionHash(
        await walletClient.writeContract({
          address: contractAddress(),
          abi: ZORQ_REGISTRY_ABI,
          functionName: "createJob",
          args: [
            draft.chainJobId,
            draft.purposeHash,
            draft.modelConfigHash,
            BigInt(Math.trunc(Number(draft.args[3]))),
            BigInt(Math.trunc(Number(draft.args[4]))),
            Number(draft.args[5]),
          ],
          account: wallet.walletAddress as `0x${string}`,
          chain: null,
        }),
      );

      setStatus("Waiting for block confirmation…");
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 120_000,
      });
      const confirm = await fetch(`/api/jobs/${draft.jobId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: hash, blockHash: receipt.blockHash }),
      });
      if (!confirm.ok) {
        throw new Error(await readApiError(confirm, "The job confirmation failed."));
      }
      router.push(`/app/jobs/${draft.jobId}`);
    } catch (cause) {
      setError(
        userFacingError(
          cause,
          "The job could not be published. No transaction was confirmed.",
        ),
      );
      setStatus(null);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="z-form-layout">
      <section className="z-card z-form-card">
        <div className="z-card-header">
          <div>
            <p className="z-eyebrow">Job definition</p>
            <h2 className="z-title-lg">Publish a federated job</h2>
          </div>
          <span className="z-chip z-chip-lime">3 rounds</span>
        </div>

        <div className="z-form-fields">
          <div className="z-field">
            <label htmlFor="job-title" className="z-label">
              Title
            </label>
            <input
              id="job-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              minLength={3}
              maxLength={100}
              placeholder="Synthetic binary classification"
              className="z-input"
            />
          </div>

          <div className="z-field">
            <label htmlFor="job-description" className="z-label">
              Public description
            </label>
            <textarea
              id="job-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="What the job trains and why it exists."
              className="z-textarea"
            />
          </div>

          <div className="z-field">
            <label htmlFor="job-purpose" className="z-label">
              Purpose statement
            </label>
            <textarea
              id="job-purpose"
              value={purposeText}
              onChange={(event) => setPurposeText(event.target.value)}
              rows={3}
              required
              minLength={20}
              maxLength={500}
              placeholder="State the public purpose of this training computation."
              className="z-textarea"
            />
            <p className="z-help">
              Normalized and hashed. The purpose hash is fixed once the job is
              published.
            </p>
          </div>

          <div className="z-field-grid">
            <div className="z-field">
              <label htmlFor="job-start" className="z-label">
                Starts at
              </label>
              <input
                id="job-start"
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                className="z-input"
              />
            </div>
            <div className="z-field">
              <label htmlFor="job-end" className="z-label">
                Ends at
              </label>
              <input
                id="job-end"
                type="datetime-local"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
                className="z-input"
              />
            </div>
          </div>

          <div className="z-field">
            <label htmlFor="job-max" className="z-label">
              Maximum participant cohort
            </label>
            <select
              id="job-max"
              value={maxParticipants}
              onChange={(event) => setMaxParticipants(Number(event.target.value))}
              className="z-select"
            >
              {[2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} distinct assets
                </option>
              ))}
            </select>
            <p className="z-help">
              Lifetime distinct-asset cap. Revocation does not free a slot for a
              different asset.
            </p>
          </div>

          <div className="z-form-actions">
            {!user ? (
              <button type="button" onClick={() => void connect()} className="z-button">
                Connect wallet
              </button>
            ) : (
              <button
                type="submit"
                disabled={Boolean(status && status !== "Published")}
                className="z-button"
              >
                {status ?? "Publish job"}
              </button>
            )}
            <p className="z-help">
              Publishing signs one transaction. The purpose, configuration and
              cohort cap cannot be changed later.
            </p>
          </div>

          {error ? (
            <div role="alert" className="z-alert z-alert-danger">
              <span className="z-alert-mark">!</span>
              <p>{error}</p>
            </div>
          ) : null}
        </div>
      </section>

      <aside className="z-aside-stack">
        <section className="z-card z-card-lime z-side-card">
          <p className="z-eyebrow z-eyebrow-dark">Fixed configuration</p>
          <h2 className="z-title-md z-text-dark">synthetic-binary-classifier-v1</h2>
          <dl className="z-config-list">
            {[
              ["Architecture", "Linear(8, 1)"],
              ["Loss / optimiser", "BCEWithLogitsLoss / SGD 0.05"],
              ["Local training", "Batch 32 · 2 epochs"],
              ["Aggregation", "3 rounds · FedAvg"],
            ].map(([key, value]) => (
              <div key={key} className="z-config-row z-config-row-dark">
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="z-card z-side-card">
          <div className="z-icon-tile">
            <span aria-hidden="true">02</span>
          </div>
          <h2 className="z-title-md">Immutable by design</h2>
          <p className="z-copy">
            The purpose and model-configuration hashes are committed on-chain when
            the job is published. The coordinator cannot tune them between rounds.
          </p>
        </section>

        <section className="z-card z-side-card">
          <div className="z-side-row">
            <span className="z-muted">Cohort cap</span>
            <span className="z-side-value">{maxParticipants} assets</span>
          </div>
          <div className="z-side-row">
            <span className="z-muted">Rounds</span>
            <span className="z-side-value">3</span>
          </div>
          <div className="z-side-row">
            <span className="z-muted">Chain</span>
            <span className="z-side-value">420420777</span>
          </div>
        </section>
      </aside>
    </form>
  );
}
