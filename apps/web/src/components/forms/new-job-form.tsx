"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/wallet-context";
import { contractAddress, getContractClients } from "@/lib/wallet-client";
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
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function NewJobForm() {
  const router = useRouter();
  const { wallet, user, connect } = useWallet();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [purposeText, setPurposeText] = useState("");
  const [startsAt, setStartsAt] = useState(() => localInput(new Date(Date.now() - 60_000)));
  const [endsAt, setEndsAt] = useState(() => localInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
  const [maxParticipants, setMaxParticipants] = useState(3);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !wallet) { setError("Connect and sign in with your wallet first."); return; }
    setError(null);
    try {
      setStatus("Creating job draft…");
      const response = await fetch("/api/jobs/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, purposeText,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          maxParticipants,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error?.message ?? "Job draft failed");
      const draft = (await response.json()) as Draft;

      setStatus("Waiting for wallet signature…");
      const { walletClient, publicClient } = await getContractClients(wallet);
      const hash = await walletClient.writeContract({
        address: contractAddress(),
        abi: ZORQ_REGISTRY_ABI,
        functionName: "createJob",
        args: [draft.chainJobId, draft.purposeHash, draft.modelConfigHash, BigInt(draft.args[3]), BigInt(draft.args[4]), draft.args[5]],
        account: wallet.walletAddress as `0x${string}`,
        chain: null,
      });
      setStatus("Waiting for confirmation…");
      const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
      const confirm = await fetch(`/api/jobs/${draft.jobId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: hash, blockHash: receipt.blockHash }),
      });
      if (!confirm.ok) throw new Error((await confirm.json()).error?.message ?? "Confirmation failed");
      router.push(`/app/jobs/${draft.jobId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The job could not be created.");
      setStatus(null);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="rounded-[1.75rem] bg-white p-6 sm:p-8">
        <div className="space-y-5">
          <div>
            <label htmlFor="job-title" className="block text-sm font-medium">Title</label>
            <input id="job-title" value={title} onChange={(e)=>setTitle(e.target.value)} required minLength={3} maxLength={100} className="mt-2 w-full rounded-2xl border border-[#e3e3e5] bg-[#f7f7f8] px-4 py-3 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <label htmlFor="job-description" className="block text-sm font-medium">Public description</label>
            <textarea id="job-description" value={description} onChange={(e)=>setDescription(e.target.value)} rows={3} maxLength={1000} className="mt-2 w-full rounded-2xl border border-[#e3e3e5] bg-[#f7f7f8] px-4 py-3 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <label htmlFor="job-purpose" className="block text-sm font-medium">Purpose statement</label>
            <textarea id="job-purpose" value={purposeText} onChange={(e)=>setPurposeText(e.target.value)} rows={3} required minLength={20} maxLength={500} placeholder="State the public purpose of this training computation." className="mt-2 w-full rounded-2xl border border-[#e3e3e5] bg-[#f7f7f8] px-4 py-3 text-sm outline-none focus:border-black" />
            <p className="mt-1 text-xs text-[#8a8a8f]">Normalized and hashed; the hash is published on-chain.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="job-start" className="block text-sm font-medium">Starts at</label>
              <input id="job-start" type="datetime-local" value={startsAt} onChange={(e)=>setStartsAt(e.target.value)} className="mt-2 w-full rounded-2xl border border-[#e3e3e5] bg-[#f7f7f8] px-4 py-3 text-sm outline-none focus:border-black" />
            </div>
            <div>
              <label htmlFor="job-end" className="block text-sm font-medium">Ends at</label>
              <input id="job-end" type="datetime-local" value={endsAt} onChange={(e)=>setEndsAt(e.target.value)} className="mt-2 w-full rounded-2xl border border-[#e3e3e5] bg-[#f7f7f8] px-4 py-3 text-sm outline-none focus:border-black" />
            </div>
          </div>
          <div>
            <label htmlFor="job-max" className="block text-sm font-medium">Maximum participant cohort</label>
            <select id="job-max" value={maxParticipants} onChange={(e)=>setMaxParticipants(Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-[#e3e3e5] bg-[#f7f7f8] px-4 py-3 text-sm outline-none focus:border-black">
              {[2,3,4,5].map((n)=><option key={n} value={n}>{n} distinct assets</option>)}
            </select>
            <p className="mt-1 text-xs text-[#8a8a8f]">Lifetime distinct-asset cap. Revocation does not free a slot for another asset.</p>
          </div>
          {!user ? <button type="button" onClick={() => void connect()} className="pill-button">Connect wallet</button> : (
            <button type="submit" disabled={Boolean(status && status !== "Published")} className="pill-button">{status ?? "Publish job"}</button>
          )}
          {error ? <p role="alert" className="rounded-2xl bg-[#f8ecec] px-4 py-3 text-sm text-[#7a2626]">{error}</p> : null}
        </div>
      </div>
      <aside className="space-y-4">
        <div className="rounded-[1.75rem] bg-white p-6">
          <h2 className="text-base font-semibold">Fixed configuration</h2>
          <dl className="mt-3 space-y-2 text-xs">
            {[
              ["Model", "synthetic-binary-classifier-v1"],
              ["Architecture", "Linear(8, 1)"],
              ["Loss / optimiser", "BCEWithLogitsLoss / SGD 0.05"],
              ["Local training", "Batch 32 · 2 epochs"],
              ["Rounds", "3 · FedAvg"],
            ].map(([k,v]) => <div key={k}><dt className="font-medium text-[#8a8a8f]">{k}</dt><dd className="font-mono text-[#3f3f45]">{v}</dd></div>)}
          </dl>
        </div>
        <div className="rounded-[1.75rem] bg-[#f7f7f8] p-6 text-sm leading-6 text-[#6f6f74]">
          Purpose and configuration hashes are fixed when the job is published and cannot be tuned later.
        </div>
      </aside>
    </form>
  );
}
