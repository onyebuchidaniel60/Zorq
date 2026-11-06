"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/wallet-context";
import { contractAddress, getContractClients } from "@/lib/wallet-client";
import { ZORQ_REGISTRY_ABI } from "@/server/chain/zorq-registry-abi";

type Draft = {
  assetId: string;
  chainAssetId: `0x${string}`;
  metadataCommitment: `0x${string}`;
};

export function NewAssetForm() {
  const router = useRouter();
  const { wallet, user, connect } = useWallet();
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [partition, setPartition] = useState(1);
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
      setStatus("Creating draft…");
      const draftResponse = await fetch("/api/assets/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          description,
          demoPartitionId: partition,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      if (!draftResponse.ok) throw new Error((await draftResponse.json()).error?.message ?? "Draft failed");
      const draft = (await draftResponse.json()) as Draft;

      setStatus("Waiting for wallet signature…");
      const { walletClient, publicClient } = await getContractClients(wallet);
      const hash = await walletClient.writeContract({
        address: contractAddress(),
        abi: ZORQ_REGISTRY_ABI,
        functionName: "registerAsset",
        args: [draft.chainAssetId, draft.metadataCommitment],
        account: wallet.walletAddress as `0x${string}`,
        chain: null,
      });

      setStatus("Waiting for confirmation…");
      const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
      const confirmResponse = await fetch(`/api/assets/${draft.assetId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: hash, blockHash: receipt.blockHash }),
      });
      if (!confirmResponse.ok) throw new Error((await confirmResponse.json()).error?.message ?? "Confirmation failed");
      setStatus("Asset registered");
      router.push(`/app/assets/${draft.assetId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The asset could not be registered.");
      setStatus(null);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="rounded-[1.75rem] bg-white p-6 sm:p-8">
        <div className="space-y-5">
          <div>
            <label htmlFor="asset-name" className="block text-sm font-medium">Display name</label>
            <input id="asset-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required minLength={3} maxLength={80} placeholder="Synthetic cohort A" className="mt-2 w-full rounded-2xl border border-[#e3e3e5] bg-[#f7f7f8] px-4 py-3 text-sm outline-none focus:border-black" />
            <p className="mt-1 text-xs text-[#8a8a8f]">3–80 characters. Owner-only metadata.</p>
          </div>
          <div>
            <label htmlFor="asset-description" className="block text-sm font-medium">Description <span className="font-normal text-[#8a8a8f]">(optional)</span></label>
            <textarea id="asset-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={500} className="mt-2 w-full rounded-2xl border border-[#e3e3e5] bg-[#f7f7f8] px-4 py-3 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <label htmlFor="asset-partition" className="block text-sm font-medium">Synthetic demo partition</label>
            <select id="asset-partition" value={partition} onChange={(e) => setPartition(Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-[#e3e3e5] bg-[#f7f7f8] px-4 py-3 text-sm outline-none focus:border-black">
              {[0,1,2,3,4].map((id) => <option key={id} value={id}>Partition {id}</option>)}
            </select>
          </div>
          {!user ? (
            <button type="button" onClick={() => void connect()} className="pill-button">Connect wallet</button>
          ) : (
            <button type="submit" disabled={Boolean(status && status !== "Asset registered")} className="pill-button">
              {status ?? "Register asset"}
            </button>
          )}
          {error ? <p role="alert" className="rounded-2xl bg-[#f8ecec] px-4 py-3 text-sm text-[#7a2626]">{error}</p> : null}
        </div>
      </div>
      <aside className="space-y-4">
        <div className="rounded-[1.75rem] bg-white p-6">
          <h2 className="text-base font-semibold">What happens on-chain</h2>
          <p className="mt-2 text-sm leading-6 text-[#6f6f74]">
            Your wallet signs <code className="rounded bg-[#f4f4f5] px-1.5 py-0.5 font-mono text-xs">registerAsset(assetId, commitment)</code>.
            The backend verifies chain ID, contract, sender, receipt and event arguments.
          </p>
        </div>
        <div className="rounded-[1.75rem] bg-[#dff3e6] p-6 text-sm leading-6 text-[#2d6a4a]">
          Raw data is never uploaded. A commitment is integrity evidence, not encryption.
        </div>
      </aside>
    </form>
  );
}
