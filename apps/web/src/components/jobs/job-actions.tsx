"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/wallet-context";
import { contractAddress, getContractClients } from "@/lib/wallet-client";
import { ZORQ_REGISTRY_ABI } from "@/server/chain/zorq-registry-abi";

type Asset = { id: string; displayName: string; status: string };
type Job = { id: string; chainJobId: string; status: string; startsAt: string; endsAt: string; maxParticipants: number; creatorWallet: string };

function toLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function JobActions({ job }: { job: Job }) {
  const router = useRouter();
  const { wallet, user } = useWallet();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetId, setAssetId] = useState("");
  const [validFrom, setValidFrom] = useState(() => toLocal(new Date(Date.now() + 3 * 60_000)));
  const [validUntil, setValidUntil] = useState(() => toLocal(new Date(Date.now() + 24 * 60 * 60_000)));
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isCreator = user?.walletAddress.toLowerCase() === job.creatorWallet.toLowerCase();

  useEffect(() => {
    if (!user) return;
    fetch("/api/assets")
      .then((r) => r.json())
      .then((data: { assets: Asset[] }) => {
        const active = data.assets.filter((asset) => asset.status === "active");
        setAssets(active);
        setAssetId(active[0]?.id ?? "");
      })
      .catch(() => undefined);
  }, [user]);

  async function withWallet(action: (clients: Awaited<ReturnType<typeof getContractClients>>) => Promise<void>) {
    if (!wallet) { setError("Connect your wallet first."); return; }
    setError(null);
    try { await action(await getContractClients(wallet)); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "The action failed."); setStatus(null); }
  }

  async function issueLicense(event: React.FormEvent) {
    event.preventDefault();
    await withWallet(async ({ walletClient, publicClient }) => {
      setStatus("Creating license draft…");
      const response = await fetch("/api/licenses/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId, jobId: job.id, validFrom: new Date(validFrom).toISOString(), validUntil: new Date(validUntil).toISOString(), idempotencyKey: crypto.randomUUID() }),
      });
      if (!response.ok) throw new Error((await response.json()).error?.message ?? "Draft failed");
      const draft = (await response.json()) as { licenseId: string; args: [string, string, number, number] };
      setStatus("Waiting for wallet signature…");
      const hash = await walletClient.writeContract({
        address: contractAddress(), abi: ZORQ_REGISTRY_ABI, functionName: "issueLicense",
        args: [draft.args[0] as `0x${string}`, draft.args[1] as `0x${string}`, BigInt(draft.args[2]), BigInt(draft.args[3])],
        account: wallet!.walletAddress as `0x${string}`, chain: null,
      });
      setStatus("Waiting for confirmation…");
      const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
      const confirm = await fetch(`/api/licenses/${draft.licenseId}/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ txHash: hash, blockHash: receipt.blockHash }) });
      if (!confirm.ok) throw new Error((await confirm.json()).error?.message ?? "Confirmation failed");
      setStatus("License issued");
    });
  }

  async function startRun() {
    await withWallet(async () => {
      setStatus("Starting run…");
      const response = await fetch(`/api/jobs/${job.id}/runs`, { method: "POST", headers: { "Idempotency-Key": crypto.randomUUID() } });
      if (!response.ok) throw new Error((await response.json()).error?.message ?? "Run start failed");
      const data = (await response.json()) as { run: { id: string } };
      router.push(`/app/runs/${data.run.id}`);
    });
  }

  async function setState(next: "paused" | "closed" | "open") {
    await withWallet(async ({ walletClient, publicClient }) => {
      setStatus(`Setting job ${next}…`);
      const enumValue = next === "open" ? 0 : next === "paused" ? 1 : 2;
      const hash = await walletClient.writeContract({
        address: contractAddress(), abi: ZORQ_REGISTRY_ABI, functionName: "setJobState",
        args: [job.chainJobId as `0x${string}`, enumValue],
        account: wallet!.walletAddress as `0x${string}`, chain: null,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
      const confirm = await fetch(`/api/jobs/${job.id}/state/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expectedState: next, txHash: hash, blockHash: receipt.blockHash }) });
      if (!confirm.ok) throw new Error((await confirm.json()).error?.message ?? "State confirmation failed");
      setStatus(`Job ${next}`);
    });
  }

  if (!user) return <div className="rounded-[1.75rem] bg-white p-6 text-sm text-[#6f6f74]">Connect a wallet to license an asset or manage this job.</div>;

  return (
    <div className="space-y-4">
      {isCreator ? (
        <section className="rounded-[1.75rem] bg-white p-6">
          <h2 className="text-base font-semibold">Creator controls</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => void startRun()} className="pill-button">Start three-round run</button>
            {job.status === "open" ? <button type="button" onClick={() => void setState("paused")} className="pill-button-secondary">Pause</button> : null}
            {job.status === "paused" ? <button type="button" onClick={() => void setState("open")} className="pill-button-secondary">Resume</button> : null}
            {job.status !== "closed" ? <button type="button" onClick={() => void setState("closed")} className="pill-button-secondary">Close permanently</button> : null}
          </div>
          <p className="mt-2 text-xs text-[#8a8a8f]">Pause/close takes effect at the next round snapshot. Closed is terminal.</p>
        </section>
      ) : null}

      <section className="rounded-[1.75rem] bg-white p-6">
        <h2 className="text-base font-semibold">License an asset</h2>
        {assets.length === 0 ? <p className="mt-2 text-sm text-[#6f6f74]">You need an active asset before licensing. <Link className="underline" href="/app/assets/new">Register one</Link>.</p> : (
          <form onSubmit={(event) => void issueLicense(event)} className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">Asset
              <select value={assetId} onChange={(e)=>setAssetId(e.target.value)} className="mt-1 w-full rounded-2xl border border-[#e3e3e5] bg-[#f7f7f8] px-4 py-3 text-sm">
                {assets.map((asset)=><option key={asset.id} value={asset.id}>{asset.displayName}</option>)}
              </select>
            </label>
            <label className="text-sm">Valid from<input type="datetime-local" value={validFrom} onChange={(e)=>setValidFrom(e.target.value)} className="mt-1 w-full rounded-2xl border border-[#e3e3e5] bg-[#f7f7f8] px-4 py-3 text-sm" /></label>
            <label className="text-sm">Valid until<input type="datetime-local" value={validUntil} onChange={(e)=>setValidUntil(e.target.value)} className="mt-1 w-full rounded-2xl border border-[#e3e3e5] bg-[#f7f7f8] px-4 py-3 text-sm" /></label>
            <button type="submit" className="pill-button sm:col-span-2">{status ?? "Issue DataLicense"}</button>
          </form>
        )}
      </section>
      {error ? <p role="alert" className="rounded-2xl bg-[#f8ecec] px-4 py-3 text-sm text-[#7a2626]">{error}</p> : null}
    </div>
  );
}
