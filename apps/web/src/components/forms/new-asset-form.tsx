"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/wallet-context";
import { contractAddress, getContractClients } from "@/lib/wallet-client";
import {
  fetchWithAuth,
  readApiError,
  readJsonObject,
  transactionHash,
  userFacingError,
} from "@/lib/client-api";
import { ZORQ_REGISTRY_ABI } from "@/server/chain/zorq-registry-abi";

const PARTITIONS = [0, 1, 2, 3, 4] as const;

type Draft = {
  assetId: string;
  chainAssetId: `0x${string}`;
  metadataCommitment: `0x${string}`;
};

export function NewAssetForm({
  initialUsedPartitions,
}: {
  initialUsedPartitions: number[];
}) {
  const router = useRouter();
  const { wallet, user, ensureWallet, signIn } = useWallet();
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [usedPartitions] = useState<number[]>(
    [...new Set(initialUsedPartitions)].sort((left, right) => left - right),
  );
  const [partition, setPartition] = useState<number | null>(
    PARTITIONS.find((id) => !initialUsedPartitions.includes(id)) ?? null,
  );
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (partition === null) {
      setError("No data partition is available. Deactivate an unused asset before registering another.");
      return;
    }
    setError(null);

    try {
      let activeWallet = wallet;
      if (!user) {
        activeWallet = await ensureWallet();
        const signedIn = await signIn({ reload: false, wallet: activeWallet });
        if (!signedIn) {
          throw new Error("Sign-in was not completed. Approve the wallet prompt and retry.");
        }
      } else if (!activeWallet) {
        activeWallet = await ensureWallet();
      }

      setStatus("Preparing the asset draft…");
      const draftResponse = await fetchWithAuth(
        "/api/assets/drafts",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName,
            description,
            demoPartitionId: partition,
            idempotencyKey: crypto.randomUUID(),
          }),
        },
        signIn,
        activeWallet,
      );
      if (!draftResponse.ok) {
        throw new Error(await readApiError(draftResponse, "The asset draft could not be created."));
      }
      const draft = await readJsonObject<Draft>(
        draftResponse,
        "The asset draft response was empty. Nothing was submitted.",
      );
      if (
        typeof draft.assetId !== "string" ||
        typeof draft.chainAssetId !== "string" ||
        typeof draft.metadataCommitment !== "string"
      ) {
        throw new Error("The asset draft response was incomplete. Nothing was submitted.");
      }

      setStatus("Confirm the transaction in your wallet…");
      const { walletClient, publicClient } = await getContractClients(activeWallet);
      const hash = transactionHash(
        await walletClient.writeContract({
          address: contractAddress(),
          abi: ZORQ_REGISTRY_ABI,
          functionName: "registerAsset",
          args: [draft.chainAssetId, draft.metadataCommitment],
          account: activeWallet.walletAddress as `0x${string}`,
          chain: null,
        }),
      );

      setStatus("Waiting for block confirmation…");
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 120_000,
      });
      const confirmResponse = await fetchWithAuth(
        `/api/assets/${draft.assetId}/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash: hash, blockHash: receipt.blockHash }),
        },
        signIn,
        activeWallet,
      );
      if (!confirmResponse.ok) {
        throw new Error(await readApiError(confirmResponse, "The asset confirmation failed."));
      }

      setStatus("Asset registered");
      router.push(`/app/assets/${draft.assetId}`);
    } catch (cause) {
      setError(
        userFacingError(
          cause,
          "The asset could not be registered. No transaction was confirmed.",
        ),
      );
      setStatus(null);
    }
  }

  const freeCount = PARTITIONS.filter((id) => !usedPartitions.includes(id)).length;

  return (
    <form onSubmit={(event) => void submit(event)} className="z-form-layout">
      <section className="z-card z-form-card">
        <div className="z-card-header">
          <div>
            <p className="z-eyebrow">Asset intake</p>
            <h2 className="z-title-lg">Asset details</h2>
          </div>
          <span className="z-chip z-chip-muted">No upload</span>
        </div>

        <div className="z-form-fields">
          <div className="z-field">
            <label htmlFor="asset-name" className="z-label">
              Display name
            </label>
            <input
              id="asset-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              minLength={3}
              maxLength={80}
              placeholder="Data cohort A"
              className="z-input"
            />
            <p className="z-help">3–80 characters. Owner-only metadata.</p>
          </div>

          <div className="z-field">
            <label htmlFor="asset-description" className="z-label">
              Description <span className="z-label-optional">optional</span>
            </label>
            <textarea
              id="asset-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={500}
              placeholder="What makes this data partition distinct?"
              className="z-textarea"
            />
          </div>

          <div className="z-field">
            <div className="z-label-row">
              <label htmlFor="asset-partition" className="z-label">
                Data Partition
              </label>
              <span className="z-help z-help-inline">
                {freeCount} of {PARTITIONS.length} free
              </span>
            </div>
            <select
              id="asset-partition"
              value={partition ?? ""}
              onChange={(event) => setPartition(Number(event.target.value))}
              disabled={freeCount === 0}
              className="z-select"
            >
              <option value="" disabled>
                Select a partition
              </option>
              {PARTITIONS.map((id) => {
                const inUse = usedPartitions.includes(id);
                return (
                  <option key={id} value={id} disabled={inUse}>
                    Partition {id}
                    {inUse ? " (In use)" : ""}
                  </option>
                );
              })}
            </select>
            <p className="z-help">
              Only one asset can reserve a partition at a time. Used partitions are
              read from the database and disabled before submission.
            </p>
          </div>

          <div className="z-form-actions">
            <button
              type="submit"
              disabled={Boolean(status && status !== "Asset registered") || freeCount === 0}
              className="z-button"
            >
              {status ?? (user ? "Register asset" : "Sign in and register")}
            </button>
            <p className="z-help">
              The wallet signs one on-chain registration. No dataset leaves the
              provider environment.
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
        <section className="z-card z-side-card">
          <div className="z-icon-tile">
            <span aria-hidden="true">01</span>
          </div>
          <h2 className="z-title-md">What happens on-chain</h2>
          <p className="z-copy">
            Your wallet signs{" "}
            <code className="z-code">registerAsset(assetId, commitment)</code>.
            The backend verifies chain ID, contract, sender, receipt and event
            arguments before marking the asset active.
          </p>
        </section>

        <section className="z-card z-card-lime z-side-card">
          <p className="z-eyebrow z-eyebrow-dark">Data boundary</p>
          <h2 className="z-title-md z-text-dark">Commitment, not custody</h2>
          <p className="z-copy z-text-dark-soft">
            A salted commitment is integrity evidence. Raw data partitions never
            leave the provider&apos;s runtime.
          </p>
        </section>

        <section className="z-card z-side-card">
          <div className="z-side-row">
            <span className="z-muted">Partitions free</span>
            <span className="z-side-value">{freeCount}</span>
          </div>
          <div className="z-side-row">
            <span className="z-muted">Partitions reserved</span>
            <span className="z-side-value">{usedPartitions.length}</span>
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
