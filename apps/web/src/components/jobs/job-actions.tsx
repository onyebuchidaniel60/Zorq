"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/wallet-context";
import { submitContractTransaction } from "@/lib/wallet-client";
import {
  fetchWithAuth,
  logClientError,
  readApiError,
  readJsonObject,
  userFacingError,
} from "@/lib/client-api";

type Asset = {
  id: string;
  displayName: string;
  status: string;
  dataSource: string;
  demoPartitionId: number | null;
};
type Job = {
  id: string;
  chainJobId: string;
  status: string;
  startsAt: string;
  endsAt: string;
  maxParticipants: number;
  creatorWallet: string;
};

function isAsset(value: unknown): value is Asset {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Asset).id === "string" &&
    typeof (value as Asset).displayName === "string" &&
    typeof (value as Asset).status === "string" &&
    typeof (value as Asset).dataSource === "string" &&
    ((value as Asset).demoPartitionId === null ||
      typeof (value as Asset).demoPartitionId === "number")
  );
}

function toLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function JobActions({ job }: { job: Job }) {
  const router = useRouter();
  const { wallet, user, ensureWallet, signIn } = useWallet();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetId, setAssetId] = useState("");
  const [validFrom, setValidFrom] = useState(() =>
    toLocal(new Date(Date.now() + 3 * 60_000)),
  );
  const [validUntil, setValidUntil] = useState(() =>
    toLocal(new Date(Date.now() + 24 * 60 * 60_000)),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isCreator = user?.walletAddress.toLowerCase() === job.creatorWallet.toLowerCase();

  useEffect(() => {
    if (!user) {
      return;
    }
    let cancelled = false;

    fetchWithAuth("/api/assets", { cache: "no-store" }, signIn)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await readApiError(response, "Your assets could not be loaded."));
        }
        const body = await readJsonObject<{ assets?: unknown }>(
          response,
          "The asset list returned an empty response.",
        );
        if (!Array.isArray(body.assets) || !body.assets.every(isAsset)) {
          throw new Error("The asset list response was incomplete.");
        }
        if (cancelled) {
          return;
        }
        const active = body.assets.filter((asset) => asset.status === "active");
        setAssets(active);
        setAssetId(active[0]?.id ?? "");
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          logClientError("job.assets", cause);
          setError(userFacingError(cause, "Your assets could not be loaded."));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, signIn]);

  async function withWallet(
    action: (activeWallet: NonNullable<typeof wallet>) => Promise<void>,
  ) {
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
      await action(activeWallet);
      router.refresh();
    } catch (cause) {
      logClientError("job.action", cause);
      setError(userFacingError(cause, "The action could not be completed."));
      setStatus(null);
    }
  }

  async function issueLicense(event: React.FormEvent) {
    event.preventDefault();
    await withWallet(async (activeWallet) => {
      setStatus("Preparing the license draft…");
      const response = await fetchWithAuth(
        "/api/licenses/drafts",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assetId,
            jobId: job.id,
            validFrom: new Date(validFrom).toISOString(),
            validUntil: new Date(validUntil).toISOString(),
            idempotencyKey: crypto.randomUUID(),
          }),
        },
        signIn,
        activeWallet,
      );
      if (!response.ok) {
        throw new Error(await readApiError(response, "The license draft could not be created."));
      }
      const draft = await readJsonObject<{
        licenseId: string;
        args: [string, string, number, number];
      }>(response, "The license draft response was empty. Nothing was submitted.");
      if (
        typeof draft.licenseId !== "string" ||
        !Array.isArray(draft.args) ||
        draft.args.length !== 4 ||
        !draft.args.every((value) => value !== null && value !== undefined)
      ) {
        throw new Error("The license draft response was incomplete. Nothing was submitted.");
      }

      setStatus("Confirm the transaction in your wallet…");
      const { hash, blockHash } = await submitContractTransaction(
        activeWallet,
        "issueLicense",
        [
          draft.args[0] as `0x${string}`,
          draft.args[1] as `0x${string}`,
          BigInt(Math.trunc(Number(draft.args[2]))),
          BigInt(Math.trunc(Number(draft.args[3]))),
        ],
      );

      setStatus("Waiting for block confirmation…");
      const confirm = await fetchWithAuth(
        `/api/licenses/${draft.licenseId}/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash: hash, blockHash }),
        },
        signIn,
        activeWallet,
      );
      if (!confirm.ok) {
        throw new Error(await readApiError(confirm, "The license confirmation failed."));
      }
      setStatus("License issued");
    });
  }

  async function startRun() {
    await withWallet(async () => {
      setStatus("Starting the run…");
      const response = await fetchWithAuth(
        `/api/jobs/${job.id}/runs`,
        {
          method: "POST",
          headers: { "Idempotency-Key": crypto.randomUUID() },
        },
        signIn,
      );
      if (!response.ok) {
        throw new Error(await readApiError(response, "The run could not be started."));
      }
      const data = await readJsonObject<{ run?: { id?: unknown } }>(
        response,
        "The run response was empty. No run was started.",
      );
      if (typeof data.run?.id !== "string") {
        throw new Error("The run response was incomplete. No run was started.");
      }
      router.push(`/app/runs/${data.run.id}`);
    });
  }

  async function setState(next: "paused" | "closed" | "open") {
    await withWallet(async (activeWallet) => {
      setStatus(`Updating job state to ${next}…`);
      const enumValue = next === "open" ? 0 : next === "paused" ? 1 : 2;
      const { hash, blockHash } = await submitContractTransaction(
        activeWallet,
        "setJobState",
        [job.chainJobId as `0x${string}`, enumValue],
      );
      const confirm = await fetchWithAuth(
        `/api/jobs/${job.id}/state/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expectedState: next, txHash: hash, blockHash }),
        },
        signIn,
        activeWallet,
      );
      if (!confirm.ok) {
        throw new Error(await readApiError(confirm, "The job state confirmation failed."));
      }
      setStatus(`Job ${next}`);
    });
  }

  if (!user) {
    return (
      <section className="z-card z-side-card">
        <h2 className="z-title-md">Wallet required</h2>
        <p className="z-copy">
          Connect a wallet to license an asset or manage this job.
        </p>
      </section>
    );
  }

  return (
    <div className="z-aside-stack">
      {isCreator ? (
        <section className="z-card z-side-card">
          <div className="z-card-header z-card-header-tight">
            <div>
              <p className="z-eyebrow">Creator</p>
              <h2 className="z-title-md">Job controls</h2>
            </div>
            <span className="z-chip z-chip-lime">Owner</span>
          </div>
          <div className="z-button-stack">
            <button type="button" onClick={() => void startRun()} className="z-button z-button-full">
              Start three-round run
            </button>
            <div className="z-button-row">
              {job.status === "open" ? (
                <button type="button" onClick={() => void setState("paused")} className="z-button-secondary">
                  Pause
                </button>
              ) : null}
              {job.status === "paused" ? (
                <button type="button" onClick={() => void setState("open")} className="z-button-secondary">
                  Resume
                </button>
              ) : null}
              {job.status !== "closed" ? (
                <button type="button" onClick={() => void setState("closed")} className="z-button-secondary">
                  Close
                </button>
              ) : null}
            </div>
          </div>
          <p className="z-help">
            Pause and close take effect at the next round snapshot. Closed is
            terminal.
          </p>
        </section>
      ) : null}

      <section className="z-card z-side-card">
        <div className="z-card-header z-card-header-tight">
          <div>
            <p className="z-eyebrow">Data provider</p>
            <h2 className="z-title-md">License an asset</h2>
          </div>
          <span className="z-chip z-chip-muted">ERC-721</span>
        </div>
        {assets.length === 0 ? (
          <p className="z-copy">
            You need an active asset before licensing.{" "}
            <Link className="z-link" href="/app/assets/new">
              Register one
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={(event) => void issueLicense(event)} className="z-form-fields">
            <div className="z-field">
              <label className="z-label" htmlFor="license-asset">
                Asset
              </label>
              <select
                id="license-asset"
                value={assetId}
                onChange={(event) => setAssetId(event.target.value)}
                className="z-select"
              >
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.displayName} · {asset.dataSource === "external" ? "external database" : `partition ${asset.demoPartitionId}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="z-field-grid">
              <div className="z-field">
                <label className="z-label" htmlFor="license-from">
                  Valid from
                </label>
                <input
                  id="license-from"
                  type="datetime-local"
                  value={validFrom}
                  onChange={(event) => setValidFrom(event.target.value)}
                  className="z-input"
                />
              </div>
              <div className="z-field">
                <label className="z-label" htmlFor="license-until">
                  Valid until
                </label>
                <input
                  id="license-until"
                  type="datetime-local"
                  value={validUntil}
                  onChange={(event) => setValidUntil(event.target.value)}
                  className="z-input"
                />
              </div>
            </div>
            <button type="submit" className="z-button z-button-full">
              {status ?? "Issue DataLicense"}
            </button>
          </form>
        )}
      </section>

      {error ? (
        <div role="alert" className="z-alert z-alert-danger">
          <span className="z-alert-mark">!</span>
          <p>{error}</p>
        </div>
      ) : null}
    </div>
  );
}
