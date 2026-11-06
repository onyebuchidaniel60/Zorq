"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/wallet-context";
import { submitContractTransaction } from "@/lib/wallet-client";
import {
  discardDraft,
  fetchWithAuth,
  logClientError,
  readApiError,
  readJsonObject,
  shouldDiscardDraft,
  userFacingError,
} from "@/lib/client-api";

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
  const [dataSource, setDataSource] = useState<"demo" | "external">("demo");
  const [dbUrl, setDbUrl] = useState("");
  const [dbTable, setDbTable] = useState("");
  const [labelColumn, setLabelColumn] = useState("label");
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
    const isExternal = dataSource === "external";
    if (!isExternal && partition === null) {
      setError("No data partition is available. Deactivate an unused asset before registering another.");
      return;
    }
    if (isExternal && (!dbUrl.trim() || !dbTable.trim())) {
      setError("Enter the external database URL and table name.");
      return;
    }
    setError(null);
    let draftId: string | null = null;

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
            dataSource,
            ...(isExternal
              ? {
                  dbUrl: dbUrl.trim(),
                  dbTable: dbTable.trim(),
                  labelColumn: labelColumn.trim() || "label",
                }
              : { demoPartitionId: partition }),
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
      draftId = draft.assetId;

      setStatus("Confirm the transaction in your wallet…");
      let txHash: `0x${string}`;
      let blockHash: `0x${string}`;
      try {
        const submitted = await submitContractTransaction(
          activeWallet,
          "registerAsset",
          [draft.chainAssetId, draft.metadataCommitment],
        );
        txHash = submitted.hash;
        blockHash = submitted.blockHash;
      } catch (cause) {
        if (shouldDiscardDraft(cause)) {
          await discardDraft(`/api/assets/${draft.assetId}`, signIn, activeWallet);
        }
        throw cause;
      }

      setStatus("Recording the submitted transaction…");
      const pendingResponse = await fetchWithAuth(
        `/api/assets/${draft.assetId}/pending`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash, blockHash }),
        },
        signIn,
        activeWallet,
      );
      if (!pendingResponse.ok) {
        throw new Error(
          await readApiError(
            pendingResponse,
            "The transaction was submitted, but the asset could not be queued for confirmation. Refresh the assets page before retrying.",
          ),
        );
      }

      setStatus("Submitted. Confirming on-chain…");
      router.push("/app/assets");
    } catch (cause) {
      logClientError("asset.register", cause);
      setError(
        userFacingError(
          cause,
          draftId
            ? "The asset could not be queued for confirmation. Check the assets list before retrying."
            : "The asset could not be registered. No transaction was confirmed.",
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

          <fieldset className="z-field">
            <legend className="z-label">Data Source</legend>
            <div className="z-source-toggle">
              <label className={`z-source-option ${dataSource === "demo" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="data-source"
                  value="demo"
                  checked={dataSource === "demo"}
                  onChange={() => setDataSource("demo")}
                  className="sr-only"
                />
                <span>Demo Partition</span>
                <small>Generated eight-feature evaluation data</small>
              </label>
              <label className={`z-source-option ${dataSource === "external" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="data-source"
                  value="external"
                  checked={dataSource === "external"}
                  onChange={() => setDataSource("external")}
                  className="sr-only"
                />
                <span>External Database</span>
                <small>Read-only PostgreSQL table</small>
              </label>
            </div>
          </fieldset>

          {dataSource === "external" ? (
            <>
              <div className="z-field">
                <label htmlFor="asset-db-url" className="z-label">
                  Database URL
                </label>
                <input
                  id="asset-db-url"
                  type="password"
                  value={dbUrl}
                  onChange={(event) => setDbUrl(event.target.value)}
                  required
                  autoComplete="off"
                  placeholder="postgresql://user:password@host:5432/database"
                  className="z-input"
                />
                <p className="z-help">
                  Encrypted at rest and sent only to the internal coordinator. It is
                  never returned to the browser or shown to other users.
                </p>
              </div>
              <div className="z-field-grid">
                <div className="z-field">
                  <label htmlFor="asset-db-table" className="z-label">
                    Table Name
                  </label>
                  <input
                    id="asset-db-table"
                    value={dbTable}
                    onChange={(event) => setDbTable(event.target.value)}
                    required
                    placeholder="public.training_rows"
                    className="z-input"
                  />
                </div>
                <div className="z-field">
                  <label htmlFor="asset-label-column" className="z-label">
                    Target Label Column
                  </label>
                  <input
                    id="asset-label-column"
                    value={labelColumn}
                    onChange={(event) => setLabelColumn(event.target.value)}
                    required
                    placeholder="label"
                    className="z-input"
                  />
                </div>
              </div>
              <div className="z-alert z-alert-info">
                <span className="z-alert-mark">i</span>
                <p>
                  The coordinator runs a read-only{" "}
                  <code className="z-code">SELECT * FROM {dbTable || "table"} LIMIT 1000</code>,
                  normalizes up to eight numeric features and discards the raw rows
                  after training.
                </p>
              </div>
            </>
          ) : (
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
          )}

          <div className="z-form-actions">
            <button
              type="submit"
              disabled={
                Boolean(status) ||
                (dataSource === "demo" && freeCount === 0)
              }
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
          <h2 className="z-title-md z-text-dark">
            {dataSource === "external" ? "Read-only by design" : "Commitment, not custody"}
          </h2>
          <p className="z-copy z-text-dark-soft">
            {dataSource === "external"
              ? "Connection details are encrypted at rest. The coordinator reads up to 1,000 rows for training and discards the raw result after the round."
              : "A salted commitment is integrity evidence. Raw data partitions never leave the provider's runtime."}
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
